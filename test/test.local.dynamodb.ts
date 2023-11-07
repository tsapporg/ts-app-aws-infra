import { describe, it, after } from 'node:test';
import { strict as assert } from 'node:assert';

import { LocalDynamoDB } from '../src/local.dynamodb';
import { CreateTableCommandInput, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';

const TableName = 'test';

let localDynamoDBInfra: LocalDynamoDB | undefined;

describe('test.local.dynamodb', async () => {
  after(async () => {
    if (localDynamoDBInfra) { await localDynamoDBInfra?.teardown(); }
  });
  
  it('tests local dynamodb', async (_t) => {  
    assert.doesNotThrow(
      async () => { 
        localDynamoDBInfra = await LocalDynamoDB.setup(4567, [toTable(TableName)]);
        const localDynamoDBClient = localDynamoDBInfra.getLocalDynamoDBClient();

        const putItemCommand = new PutItemCommand({
          TableName, Item: { id: { S: 'id' }, key: { S: 'value' } }
        });
        console.debug('put item', putItemCommand);
        await localDynamoDBClient.send(putItemCommand);

        const getItemCommand = new GetItemCommand({
          TableName, Key: { id: { S: 'id' } }
        });
        console.debug('get item', getItemCommand);

        const item = await localDynamoDBClient.send(getItemCommand);
        console.debug('item', item);

        assert.equal(item.Item?.id.S, 'id');
        assert.equal(item.Item?.key.S, 'value');

        await localDynamoDBInfra.teardown();
      }
    );
  });
});

const toTable = (TableName: string): CreateTableCommandInput => {
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