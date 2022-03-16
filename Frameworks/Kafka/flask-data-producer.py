import atexit
import logging
import json
import time

from googlefinance import getQuotes
import yfinance as yf
from apscheduler.schedulers.background import BackgroundScheduler

import numpy as np

class NpEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super(NpEncoder, self).default(obj)


from flask import (
    Flask,
    request,
    jsonify
)

from kafka import KafkaProducer
from kafka.errors import (
    KafkaError,
    KafkaTimeoutError
)

logger_format = '%(asctime)-15s %(message)s'
logging.basicConfig(format=logger_format)
logger = logging.getLogger('data-producer')
logger.setLevel(logging.INFO)

app = Flask(__name__)
app.config.from_envvar('ENV_CONFIG_FILE')
kafka_broker = app.config['CONFIG_KAFKA_ENDPOINT']
topic_name = app.config['CONFIG_KAFKA_TOPIC']

print(kafka_broker, topic_name)

stocks = []

producer = KafkaProducer(
    bootstrap_servers=kafka_broker,
    api_version=(0, 10)
)

schedule = BackgroundScheduler({'apscheduler.job_defaults.max_instances': 4})
schedule.add_executor('threadpool')
schedule.start()

symbols = set()


def shutdown_hook():
    """
    a shutdown hook to be called before the shutdown
    """
    try:
        logger.info('Flushing pending messages to kafka, timeout is set to 10s')
        producer.flush(10)
        logger.info('Finish flushing pending messages to kafka')
    except KafkaError as kafka_error:
        logger.warn('Failed to flush pending messages to kafka, caused by: %s', kafka_error.message)
    finally:
        try:
            logger.info('Closing kafka connection')
            producer.close(10)
        except Exception as e:
            logger.warn('Failed to close kafka connection, caused by: %s', e.message)
    try:
        logger.info('shutdown scheduler')
        schedule.shutdown()
    except Exception as e:
        logger.warn('Failed to shutdown scheduler, caused by: %s', e.message)


def fetch_price(symbol):
    """
    helper function to retrieve stock data and send it to kafka
    :param symbol: symbol of the stock
    :return: None
    """
    logger.debug('Start to fetch stock price for %s', symbol)
    
    # print("Symbol:" ,symbol)
    # s = yf.Ticker(symbol)
    # print(s.info)
    
    # name = s.info['shortName']

    # data = s.history(period = '1d', interval = '1m')
    # print(stocks)
    data = yf.download(tickers = stocks, period = '1d', interval = '1m', verbose = 0)
    
        # print(s.history(period = '100d'))
    # price = json.dumps(s.history(period = '100d'))
    data = data.dropna(how = 'any')

    for s in stocks:
        dct = {}
        val = 0
        # print(data.shape)
        if len(stocks) > 1:
            val = data['Close'][s].values[-1]
        else:
            val = data['Close'].values[-1]

        for col in data.columns:
            if len(stocks) > 1 and col[1] != s:
                continue
            if len(stocks) > 1:    
                dct[col[0]] = data[col[0]][s].values[-2]
            else:
                dct[col] = data[col].values[-2]

        dct['StockSymbol'] = s
        dct['Price'] = val
        dct['Name'] = "Empty"
        bprice = json.dumps(dct, cls = NpEncoder).encode('utf-8')
        # print(s, bprice)
        try:
            producer.send(topic=topic_name, value=bprice, timestamp_ms=int(time.time()))
        except KafkaTimeoutError as timeout_error:
            logger.warning('Failed to send stock price for %s to kafka, caused by: %s', (symbol, timeout_error.message))
        except Exception:
            logger.warning('Failed to fetch stock price for %s', symbol)


def query_price(symbol):

    """
    helper function to retrieve stock data and send it to kafka
    :param symbol: symbol of the stock
    :return: None
    """
    logger.debug('Start to fetch stock price for %s', symbol)
    
    # print("Symbol:" ,symbol)
    s = yf.Ticker(symbol)
    # print(s.info)
    
    name = s.info['shortName']
    data = s.history(period = '1d', interval = '1m')
    
    data = data.dropna(how = 'any')

    for s in stocks:
        dct = {}
        val = 0
        # print(data.shape)
        if len(stocks) > 1:
            val = data['Close'][s].values[-1]
        else:
            val = data['Close'].values[-1]

        for col in data.columns:
            if len(stocks) > 1 and col[1] != s:
                continue
            if len(stocks) > 1:    
                dct[col[0]] = data[col[0]][s].values[-2]
            else:
                dct[col] = data[col].values[-2]

        dct['StockSymbol'] = s
        dct['Price'] = val
        dct['Name'] = name
        bprice = json.dumps(dct, cls = NpEncoder).encode('utf-8')
        print(s, bprice)
        try:
            producer.send(topic=topic_name, value=bprice, timestamp_ms=int(time.time()))
        except KafkaTimeoutError as timeout_error:
            logger.warning('Failed to send stock price for %s to kafka, caused by: %s', (symbol, timeout_error.message))
        except Exception:
            logger.warning('Failed to fetch stock price for %s', symbol)



@app.route('/query/<symbol>', methods=['POST'])
def query_stock(symbol):
    if not symbol:
        return jsonify({
            'error': 'Stock symbol cannot be empty'
        }), 400
    if symbol in symbols:
        pass
    else:
        # symbol = symbol.encode('utf-8')
        stocks.append(symbol)
        symbols.add(symbol)
        logger.info('Add stock retrieve job %s' % symbol)
        # print("Symbol:", symbol, len(symbol))
        # schedule.add_job(fetch_price, 'interval', [symbol], seconds=1, id=symbol.decode("utf-8"))
        schedule.add_job(query_price, 'interval', [symbol], seconds=1, id=symbol)
    return jsonify(results=list(symbols)), 200


@app.route('/<symbol>', methods=['POST'])
def add_stock(symbol):
    if not symbol:
        return jsonify({
            'error': 'Stock symbol cannot be empty'
        }), 400
    if symbol in symbols:
        pass
    else:
        # symbol = symbol.encode('utf-8')
        stocks.append(symbol)
        symbols.add(symbol)
        logger.info('Add stock retrieve job %s' % symbol)
        # print("Symbol:", symbol, len(symbol))
        # schedule.add_job(fetch_price, 'interval', [symbol], seconds=1, id=symbol.decode("utf-8"))
        schedule.add_job(fetch_price, 'interval', [symbol], seconds=1, id=symbol)
    return jsonify(results=list(symbols)), 200


@app.route('/<symbol>', methods=['DELETE'])
def del_stock(symbol):
    if not symbol:
        return jsonify({
            'error': 'Stock symbol cannot be empty'
        }), 400
    if symbol not in symbols:
        pass
    else:
        symbols.remove(symbol)
        schedule.remove_job(symbol)
    return jsonify(results=list(symbols)), 200

if __name__ == '__main__':
    atexit.register(shutdown_hook)
    app.run(host='127.0.0.1', port=app.config['CONFIG_APPLICATION_PORT'])
