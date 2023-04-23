// import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { ClientClosedError, commandOptions, createClient } from 'redis';
import {
  AcknowledgeMessageParams,
  AddToStreamParams,
  AutoclaimMessageParams,
  CosnumeStreamParams,
  ReadStreamParams
} from './interfaces';

import executeQuery, { insertDB, redis } from '../../lib/db';

 export let isAlive = true;

function ping() {
    return redis.ping();
  }



  /**
   * Close redis connection on shutdown
   */
  function disconnectRedis() {
    redis.quit();
  }


/**
   * For example purposes, this will add a new message to the stream every second.
   */
   export function populateStream() {

    const interval = setInterval(async () => {
              console.log("----------------populating stream--------")

       addToStream(
        {
          'id': Date.now() + 2,
          'name': "hello",
          'category': 'warning',
          'spendDate': new Date(),
          'amount': { num: Date.now() % 100 },
        },
        'EXAMPLE_STREAM_NAME',
      );
    }, 1000);
  }



  /**
   * Adding object to stream
   */
 export async function addToStream(
    fieldsToStore,
    streamName,
  ): Promise<string> {
  console.log(fieldsToStore)

    // Converting object to record to store in redis
  if(fieldsToStore !== 'undefined'){
    const messageObject = Object.entries(fieldsToStore).reduce(
      (acc, [key, value]) => {
        if (typeof value === 'undefined') {
          return acc;
        }
        acc[key] = typeof value === 'string' ? value : JSON.stringify(value);
        return acc;
      },
      {} as Record<string, string>,
    );
  

    // Adding to stream with trimming - approximately max 100 messages
    return redis.xAdd(streamName, '*', messageObject, {
      TRIM: {
        strategy: 'MAXLEN',
        strategyModifier: '~',
        threshold: 100,
      },
    });
  }
}

  /**
   * Wrapping xRead to handle errors
   */
   async function readStream({
    streamName,
    blockMs,
    count,
    lastMessageId,
  }: ReadStreamParams): Promise<RedisStreamMessage[] | null> {
    try {
      console.log("last message id: " + lastMessageId);
      const response = await redis.xRead(
        commandOptions({ isolated: true }), // uses new connection from pool not to block other redis calls
        [
          {
            key: streamName,
            id: lastMessageId,
          },
        ],
        { BLOCK: blockMs, COUNT: count },
      );
      console.log("in readstream----------");
      const { messages } = response?.[0]; // returning first stream (since only 1 stream used)

      return messages || null;
    } catch (error) {
      if (error instanceof ClientClosedError) {
        console.log(`${error.message} ...RECONNECTING`);
        await connectToRedis();
        return null;
      }
      console.error(`Failed to xRead from Redis stream: ${error.message}`);
      return null;
    }
  }


    /**
   * We can also fetch multiple messages at a time.
   */
   export async function getMultipleNewMessages(count: number) {
    const generator = getStreamMessageGenerator(
      'EXAMPLE_STREAM_NAME',
      count,
    );
    const messages: Record<string, string>[] = [];
    const idsArray = [];
    let counter = 0;
    for await (const messageObj of generator) {
      messages.push(parseMessage(messageObj.message));
      idsArray.push(messageObj.id);
      console.log("In get multiplenewmessages--------------" + messageObj);
      counter++;
      // if(typeof messageObj.message === 'String'); {
      //   break;
      // }
      if (counter >= count) {
        break;
      }
    }

    await insertDB(messages, idsArray);
    console.log("finished inserting");

    return messages;
  }


/**
   * This will continuously read messages from the stream until the service is destroyed.
   */
 export async function continuousReadMessages() {
    const generator = getStreamMessageGenerator(
      'EXAMPLE_STREAM_NAME',
      10,
    );

    var results =  [];
    var idsArray = [];
    let count = 0;

    for await (const messageObj of generator) {

      console.log(
        `Got message with ID: ${messageObj.id}`,
        JSON.stringify(parseMessage(messageObj.message), undefined, 2),
      );
      // idsArray.push(messageObj.id);
      var parsedMessage = parseMessage(messageObj.message);
      results.push(parsedMessage);
      idsArray.push(parsedMessage.id);
      count++;

    if (count >= 10) {
      console.log("----------Inserting in db--------");
      await insertDB(results, idsArray);
      console.log("finished inserting");
      count = 0;
      results =  [];
      idsArray = [];
    }
    // console.log(results);
      if (!isAlive) {
        break;
      }
    }
    

    return results;
  }


/**
   * Creating generator that will read from stream
   * Utilizing generator lazy evaluation to only fetch data when needed
   */
    export async function *getStreamMessageGenerator(
    streamName: string,
    count: number,
  ): AsyncRedisStreamGenerator {
    // Start with latest data
    // let lastMessageId = '$';
    let lastMessageId = '0';
    
    while (isAlive) {
      const response = await readStream({
        streamName,
        blockMs: 0, // 0 = infinite blocking until at least one message is fetched, or timeout happens
        count, // max how many messages to fetch at a time
        lastMessageId,
      });
      
      // // If no messages returned, continue to next iteration without yielding
      if (!response || response.length === 0) {
        continue;
      }

      // Update last message id to be the last message returned from redis
      // lastMessageId = response[response.length - 1].id;
      console.log("Last message: " + JSON.stringify(response[response.length-1]));
      lastMessageId = response[response.length-1].id;
      
      
      for (const message of response) {
        yield message;
      }
    }
  }

  /**
   * Creating generator that will read from consumer group
   * We will use auto claim feature to automatically claim messages that are idle for a certain amount of time
   */
   async function *getConsumerMessageGenerator({
    streamName,
    group,
    consumer,
    count,
    autoClaimMinIdleTimeMs,
    autoAck = true,
  }: ReadConsumerGroupParams): AsyncRedisStreamGenerator {
    let fetchNewMessages = true; // Toggle for switching between fetching new messages and auto claiming messages
    while (isAlive) {
      let response: RedisStreamMessage[];
      if (fetchNewMessages) {
        response = await readConsumerGroup({
          streamName,
          group,
          consumer,
          blockMs: 0, // 0 = infinite blocking until at least one message is fetched, or timeout happens
          count,
        });
      } else {
        // Try to auto claim messages that are idle for a certain amount of time
        response = await autoClaimMessage({
          streamName,
          group,
          consumer,
          count,
          minIdleTimeMs:
            autoClaimMinIdleTimeMs || StreamHandlerService.DEFAULT_IDLE_TIME_MS,
        });
      }

      // Acknowledge messages if autoAck is enabled
      if (autoAck && response?.length > 0) {
        await acknowledgeMessages({
          streamName,
          group,
          messageIds: response.map((m) => m.id),
        });
      }

      // Toggle between fetching new messages and auto claiming messages
      fetchNewMessages = !fetchNewMessages;

      // If no messages returned, continue to next iteration without yielding
      if (!response || response.length === 0) {
        continue;
      }
      for (const message of response) {
        yield message;
      }
    }
  }


   async function readConsumerGroup({
    streamName,
    group,
    consumer,
    blockMs,
    count,
  }: CosnumeStreamParams): Promise<RedisStreamMessage[] | null> {
    let response: RedsXReadGroupResponse = null;
    try {
      response = await redis.xReadGroup(
        commandOptions({ isolated: true }), // uses new connection from pool not to block other redis calls
        group,
        consumer,
        {
          key: streamName,
          id: '>',
        },
        { BLOCK: blockMs, COUNT: count },
      );
    } catch (error) {
      if (error instanceof ClientClosedError) {
        console.log(`${error.message} ...RECONNECTING`);
        await connectToRedis();
        return null;
      }
      if (error.message.includes('NOGROUP')) {
        console.log(`${error.message} ...CREATING GROUP`);
        await createConsumerGroup(streamName, group);
        return null;
      }
      console.error(
        `Failed to xReadGroup from Redis stream: ${error.message}`,
        error,
      );

      return null;
    }

    const messages = response?.[0]?.messages; // returning first stream (since only 1 stream used)
    return messages || null;
  }

   async function acknowledgeMessages({
    streamName,
    group,
    messageIds,
  }: AcknowledgeMessageParams) {
    try {
      await redis.xAck(streamName, group, messageIds);
    } catch (error) {
      if (error instanceof ClientClosedError) {
        console.log(`${error.message} ...RECONNECTING`);
        await connectToRedis();
        return null;
      }
      console.error(`Failed to xAck from Redis stream: ${error.message}`);
      return null;
    }
  }

   async  function autoClaimMessage({
    streamName,
    group,
    consumer,
    minIdleTimeMs,
    count,
  }: AutoclaimMessageParams) {
    let response: RedsXAutoClaimResponse = null;
    try {
      response = await redis.xAutoClaim(
        streamName,
        group,
        consumer,
        minIdleTimeMs,
        '0-0', // use 0-0 to claim all messages. In case of multiple consumers, this will be used to claim messages from other consumers
        {
          COUNT: count,
        },
      );
    } catch (error) {
      if (error instanceof ClientClosedError) {
        console.log(`${error.message} ...RECONNECTING`);
        await connectToRedis();
        return null;
      }
      console.error(`Failed to xAutoClaim from Redis stream: ${error.message}`);
      return null;
    }
    return response?.messages || null;
  }

   async function createConsumerGroup(streamName: string, group: string) {
    try {
      await redis.xGroupCreate(
        streamName,
        group,
        '0', // use 0 to create group from the beginning of the stream, use '$' to create group from the end of the stream
        {
          MKSTREAM: true,
        },
      );
    } catch (error) {
      if (error.message.includes('BUSYGROUP')) {
        // Consumer group already exists
        return;
      }
      if (error instanceof ClientClosedError) {
        console.log(`${error.message} ...RECONNECTING`);
        await connectToRedis();
        return null;
      }
      console.error(`Failed to xGroupCreate: ${error.message}`);
      return null;
    }
  }

    export async function connectToRedis() {
    try {
      // Try to reconnect  only if connection socket is closed. Else let it be handled by reconnect strategy.
      if (!redis.isOpen) {
        await redis.connect();
         console.log("Connected to redis");
      } else {
        isAlive = false;
      }
    } catch (error) {
      console.error(`[${error.name}] ${error.message}`, error);
    }
  }

  /**
   * Since Redis stores all values as strings, we need to parse them back to their original type.
   */
  export function parseMessage(message: Record<string, string>) {
    return Object.entries(message).reduce((acc, [key, value]) => {
      try {
        while(typeof JSON.parse(value) === 'object'){
          value = JSON.parse(value);
          value = value['num'];
        }
        acc[key] = JSON.parse(value);
      } catch (e) {
        acc[key] = value;
      }
      return acc;
    }, {});
  }

// export default redis;
