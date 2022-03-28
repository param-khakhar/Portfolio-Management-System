# - read from kafka topic
# - publish to redis pub

from kafka import KafkaConsumer

import sys
# import argparse
import atexit
# import logging
import redis

# - default kafka topic to write to
topic_name = 'stock-analyzer'

# - default kafka broker location
kafka_broker = '127.0.0.1:9092'


# logger_format = '%(asctime)-15s %(message)s'
# logging.basicConfig(format=logger_format)
# logger = logging.getLogger('redis-publisher')
# logger.setLevel(logging.DEBUG)

def shutdown_hook(kafka_consumer):
    """
    a shutdown hook to be called before the shutdown
    :param kafka_consumer: instance of a kafka consumer
    :return: None
    """
    print('Shutdown kafka consumer')
    kafka_consumer.close()

if __name__ == '__main__':
    # - setup command line arguments
    # parser = argparse.ArgumentParser()
    # parser.add_argument('topic_name', help='the kafka topic consume from')
    # parser.add_argument('kafka_broker', help='the location of the kafka broker')
    # parser.add_argument('redis_channel', help='the redis channel to publish to')
    # parser.add_argument('redis_host', help='the location of the redis server')
    # parser.add_argument('redis_port', help='the redis port')

    # - parse arguments
    # args = parser.parse_args()
    topic_name = sys.argv[1]
    kafka_broker = sys.argv[2]
    redis_channel = sys.argv[3]
    redis_host = sys.argv[4]
    redis_port = sys.argv[5]

    # - instantiate a simple kafka consumer
    kafka_consumer = KafkaConsumer(
        topic_name,
        bootstrap_servers=kafka_broker
    )

    # - instantiate a redis client
    redis_client = redis.StrictRedis(host=redis_host, port=redis_port)

    # - setup proper shutdown hook
    atexit.register(shutdown_hook, kafka_consumer)

    for msg in kafka_consumer:
        print('Received new data from kafka %s' % str(msg))
        redis_client.publish(redis_channel, msg.value)
        print("Published:", redis_channel, msg.value)

