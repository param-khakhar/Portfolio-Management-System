import atexit                                                       # Used for running functions on termination
import json                                                         # For sending messages within the client-server architecture
import time                                                         # Library for measuring time
import numpy as np                                                  # Scientific vectorized computations.

from apscheduler.schedulers.background import BackgroundScheduler

import yfinance as yf                                               # For getting live quotes

class NpEncoder(json.JSONEncoder):
    """
        Encode Numpy objects to JSON, by first identifying the type and then performing corresponding operations.
    """
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super(NpEncoder, self).default(obj)

from flask import Flask, request, jsonify                           # Used for communication with client (Front-End)

from kafka import KafkaProducer                                     #    
from kafka.errors import KafkaError, KafkaTimeoutError              # Used for error handling.


app = Flask(__name__)
kafka_broker = 'localhost:9092'                                     # Address, Port of the Broker
topic_name = 'stock-analyzer'                                       # Channel topic in Kafka

stocks = []                                                         # Global list of stock symbols, which gets updated
symbols = set()

producer = KafkaProducer(bootstrap_servers=kafka_broker, api_version=(0, 10))

# Producers are compute engines which read quotes from yfinance and push them to the message queue.

schedule = BackgroundScheduler({'apscheduler.job_defaults.max_instances': 4})       # Works in the background
schedule.add_executor('threadpool')                                 # Multi-threaded              
schedule.start()



def shutdown_hook():
    """
    A shutdown hook to be called before the shutdown. Systematically ending the execution.
    """
    try:
        print('Flushing pending messages to kafka, timeout is set to 10s')
        producer.flush(10)
        print('Finish flushing pending messages to kafka')
    except KafkaError as kafka_error:
        print('Failed to flush pending messages to kafka, caused by: %s', kafka_error.message)

    finally:
        try:
            print('Closing kafka connection')
            producer.close(10)
        except Exception as e:
            print('Failed to close kafka connection, caused by: %s', e.message)
    try:
        print('shutdown scheduler')
        schedule.shutdown()
    except Exception as e:
        print('Failed to shutdown scheduler, caused by: %s', e.message)



def fetch_price(symbol):
    """
    helper function to retrieve stock data and send it to message queue.
    :param symbol: symbol of the stock
    :return: None
    """
    print('Start to fetch stock price for %s', symbol)
    data = yf.download(tickers = stocks, period = '1d', interval = '1m', verbose = 0)

    # Drop rows in the end containing any NaNs
    data = data.dropna(how = 'any')

    for s in stocks:
        dct = {}
        val = 0
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

        # Encode the above dct, to be sent into the message queue.
        bprice = json.dumps(dct, cls = NpEncoder).encode('utf-8')
        # print(s, bprice)
        try:
            producer.send(topic=topic_name, value=bprice, timestamp_ms=int(time.time()))
        except KafkaTimeoutError as timeout_error:
            print('Failed to send stock price for %s to kafka, caused by: %s', (symbol, timeout_error.message))
        except Exception:
            print('Failed to fetch stock price for %s', symbol)



def query_price(symbol):

    """
    helper function to retrieve stock data and send it to kafka
    :param symbol: symbol of the stock
    :return: None
    """

    print('Start to fetch stock price for %s', symbol)
    
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


        # print(s, bprice)
        try:
            producer.send(topic=topic_name, value=bprice, timestamp_ms=int(time.time()))
        except KafkaTimeoutError as timeout_error:
            print('Failed to send stock price for %s to kafka, caused by: %s', (symbol, timeout_error.message))
        except Exception:
            print('Failed to fetch stock price for %s', symbol)


@app.route('/query/<symbol>', methods=['POST'])
def query_stock(symbol):
    if not symbol:
        return jsonify({
            'error': 'Stock symbol cannot be empty'
        }), 400
    if symbol in symbols:
        pass
    else:
        stocks.append(symbol)
        symbols.add(symbol)
        logger.info('Add stock retrieve job %s' % symbol)
        # print("Symbol:", symbol, len(symbol))
        # schedule.add_job(fetch_price, 'interval', [symbol], seconds=1, id=symbol.decode("utf-8"))
        schedule.add_job(query_price, 'interval', [symbol], seconds=5, id=symbol)
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
        stocks.append(symbol)
        print('Add stock retrieve job %s' % symbol)
        # schedule.add_job(fetch_price, 'interval', [symbol], seconds=1, id=symbol.decode("utf-8"))
        schedule.add_job(fetch_price, 'interval', [symbol], seconds=5, id=symbol)
    return jsonify(results=list(symbols)), 200


if __name__ == '__main__':
    atexit.register(shutdown_hook)
    app.run(host='127.0.0.1', port=5000)

