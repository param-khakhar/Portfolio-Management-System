# - read from any kafka
# - write to any cassandra
# - get message from kafka write to cassandra
from cassandra.cluster import Cluster
from kafka import KafkaConsumer
from kafka.errors import KafkaError
from ast import literal_eval
from datetime import datetime

import argparse
import atexit
import json
import logging

# - default kafka topic to read from
topic_name = 'stock-analyzer'

# - default kafka broker location
kafka_broker = '127.0.0.1:9092'

# - default cassandra nodes to connect
contact_points = '127.0.0.1'

# - default keyspace to use
key_space = 'stock'

# - default table to use
data_table = 'stock'

logger_format = '%(asctime)-15s %(message)s'
logging.basicConfig(format=logger_format)
logger = logging.getLogger('data-storage')
logger.setLevel(logging.DEBUG)


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


def shutdown_hook(consumer, session):
    """
    a shutdown hook to be called before the shutdown
    :param consumer: instance of a kafka consumer
    :param session: instance of a cassandra session
    :return: None
    """
    try:
        logger.info('Closing Kafka Consumer')
        consumer.close()
        logger.info('Kafka Consumer closed')
        logger.info('Closing Cassandra Session')
        session.shutdown()
        logger.info('Cassandra Session closed')
    except KafkaError as kafka_error:
        logger.warn('Failed to close Kafka Consumer, caused by: %s', kafka_error.message)
    finally:
        logger.info('Existing program')


if __name__ == '__main__':
    # - setup command line arguments
    parser = argparse.ArgumentParser()
    parser.add_argument('topic_name', help='the kafka topic to subscribe from')
    parser.add_argument('kafka_broker', help='the location of the kafka broker')
    parser.add_argument('key_space', help='the keyspace to use in cassandra')
    parser.add_argument('data_table', help='the data table to use')
    parser.add_argument('contact_points', help='the contact points for cassandra')

    # - parse arguments
    args = parser.parse_args()
    topic_name = args.topic_name
    kafka_broker = args.kafka_broker
    key_space = args.key_space
    data_table = args.data_table
    contact_points = args.contact_points

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
