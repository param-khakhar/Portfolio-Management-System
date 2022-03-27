import atexit                                                       # Used for running functions on termination
import json                                                         # For sending messages within the client-server architecture
import time                                                         # Library for measuring time
import numpy as np                                                  # Scientific vectorized computations.


from kafka import KafkaProducer
from kafka.errors import KafkaError, KafkaTimeoutError
from pyspark import SparkContext
from pyspark.streaming import StreamingContext
from pyspark.streaming.kafka import KafkaUtils

topic = None
target_topic = None
brokers = None
kafka_producer = None

def shutdown_hook(producer):
    """
    a shutdown hook to be called before the shutdown
    :parameter producer: instance of a kafka producer
    :return: None
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



def process_stream(stream):

    """
    Perform stream processing operations
    """

    def send_to_kafka(rdd):
        results = rdd.collect()
        for r in results:
            # print(r)
            data = json.dumps(
                {
                    'symbol': r[0],
                    'timestamp': time.time(),
                    'close': r[2],
                    'open' : r[1],
                    'high' : r[3],
                    'low' : r[4],
                    'volume' : r[5],
                    'price' : r[6],
                    'name' : r[7]
                }
            )
            try:
                # logger.info('Sending average price %s to kafka' % data)
                bprice = json.dumps(data).encode('utf-8')
                kafka_producer.send(target_topic, value=bprice)
            except KafkaError as error:
                logger.warn('Failed to send average stock price to kafka, caused by: %s', error.message)

    def pairs(data):
        # record = json.loads(data[1].decode('utf-8'))[0]
        record = json.loads(data[1])
        # a, b = record.get('StockSymbol'), (float(record.get('Open')),1), (float(record.get('Close')),1), (float(record.get('High')),1), (float(record.get('Low')),1)
        # print(a, b)
        return record.get('StockSymbol'), round(float(record.get('Open')), 2), round(float(record.get('Close')), 2), round(float(record.get('High')), 2), round(float(record.get('Low')), 2), int(record.get('Volume')), round(float(record.get('Price')), 2), record.get('Name')
    
    # stream.map(pair).reduceByKey(lambda a, b: (a[0] + b[0], a[1] + b[1])).map(lambda k, v: (k, v[0]/v[1])).foreachRDD(send_to_kafka)
    # stream.map(pair).reduceByKey(lambda a, b: (a[0] + b[0], a[1] + b[1])).map(lambda k: (k[0], k[1][0]/k[1][1])).foreachRDD(send_to_kafka)
    stream.map(pairs).foreachRDD(send_to_kafka)


