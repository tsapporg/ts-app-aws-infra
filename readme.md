# ts-app-aws-infra
This package is responsible for provided AWS-specific infra software. Currently all that's in here is (yet another) Local Dynamo provider, but this one runs _without_ Docker, is typed, and uses the latest AWS SDK V3 DynamoDB client.

This source code is experimental and therefore unpublished on NPM; install directly from Github. 

## Pre-reqs
1. Java - Definitely > v11 (v11 did not work w/ latest Local Dynamo, but v17 did)

## Usage
To use Local Dynamo:

    import { LocalDynamoDB } from 'ts-app-aws-infra';
    import { CreateTableCommandInput, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';

    const createTable = (TableName: string): CreateTableCommandInput => {
      return {
        TableName,
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
        AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        },
        StreamSpecification: {
          StreamEnabled: true,
          StreamViewType: 'NEW_AND_OLD_IMAGES'
        }
      };
    }

    const localDynamoDBInfra = await LocalDynamoDB.setup(4567, [createTable('table-name')]);
    const localDynamoDBClient = localDynamoDBInfra.getLocalDynamoDBClient();

    const putItemCommand = new PutItemCommand({
      TableName: 'table-name', Item: { id: { S: 'id' }, key: { S: 'value' } }
    });
    console.debug('put item', putItemCommand);
    await localDynamoDBClient.send(putItemCommand);

    await localDynamoDBInfra.teardown();

## Test

    make tests