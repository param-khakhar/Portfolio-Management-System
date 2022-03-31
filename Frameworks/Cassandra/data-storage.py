from cassandra.cluster import Cluster
from kafka import KafkaConsumer
from kafka.errors import KafkaError
from ast import literal_eval
from datetime import datetime

import sys
import atexit

topic_name = 'stock-analyzer'
kafka_broker = '127.0.0.1:9092'
contact_points = '127.0.0.1'
key_space = 'stock'
data_table = 'stock'

def persist_data(stock_data, cassandra_session):
    """
    persist stock data into cassandra
    :param stock_data:
        the stock data looks like this:
        [{
            "Index": "NASDAQ",
            "LastTradeWithCurrency": "109.36",
            "LastTradeDateTime": "2016-08-19T16:00:02Z",
            "LastTradePrice": "109.36",
            "LastTradeTime": "4:00PM EDT",
            "LastTradeDateTimeLong": "Aug 19, 4:00PM EDT",
            "StockSymbol": "AAPL",
            "ID": "22144"
        }]
    :param cassandra_session:

    :return: None
    """
    str_stock_data = stock_data.decode('UTF-8')
    data = literal_eval(str_stock_data)
    try:
        symbol = str(data['StockSymbol'])
        price = float(data['Close'])
        tradetime = str(datetime.now())
        tradetime = tradetime[:-3]

        print(data_table, symbol, price, tradetime)
        statement = "INSERT INTO %s (stock_symbol, trade_time, trade_price) VALUES ('%s', '%s', %f)" % (data_table, symbol, tradetime, price)
        cassandra_session.execute(statement)
        logger.info('Persistend data to cassandra for symbol: %s, price: %f, tradetime: %s' % (symbol, price, tradetime))
    except Exception as e:
        logger.error('Failed to persist data to cassandra %s', e)
        statement = "INSERT INTO %s (stock_symbol, trade_time, trade_price) VALUES ('%s', '%s', %f)" % (data_table, symbol, tradetime, price)
        cassandra_session.execute(statement)
        print('Persistend data to cassandra for symbol: %s, price: %f, tradetime: %s' % (symbol, price, tradetime))
    except Exception as e:
        print('Failed to persist data to cassandra %s', e)



def shutdown_hook(consumer, session):
    try:
        consumer.close()
        session.shutdown()
        print('Cassandra Session closed')
    except KafkaError as kafka_error:
        print('Failed to close Kafka Consumer, caused by: %s', kafka_error.message)
    finally:
        print('Exiting program')



if __name__ == '__main__':

    # - parse arguments
    topic_name = sys.argv[1]
    kafka_broker = sys.argv[2]
    key_space = sys.argv[3]
    data_table = sys.argv[4]
    contact_points = sys.argv[5]

    # - initiate a simple kafka consumer
    consumer = KafkaConsumer(
        topic_name,
        bootstrap_servers=kafka_broker
    )

    # - initiate a cassandra session
    cassandra_cluster = Cluster(
        contact_points=contact_points.split(',')
    )
    session = cassandra_cluster.connect()


    session.execute("CREATE KEYSPACE IF NOT EXISTS %s WITH replication = {'class': 'SimpleStrategy', 'replication_factor': '3'} AND durable_writes = 'true'" % key_space)
    session.set_keyspace(key_space)
    session.execute("CREATE TABLE IF NOT EXISTS %s (stock_symbol text, trade_time timestamp, trade_price float, PRIMARY KEY (stock_symbol,trade_time))" % data_table)

    # - setup proper shutdown hook
    atexit.register(shutdown_hook, consumer, session)

    for msg in consumer:
        persist_data(msg.value, session)
