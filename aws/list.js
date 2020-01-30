// Working with Scans -- AWS Dynamo Developer Guide:
// https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Scan.html#Scan.FilterExpression
// aws dynamodb scan \
// --table-name Movies \
// --projection-expression "title" \
// --filter-expression 'contains(info.genres,:gen)' \
// --expression-attribute-values '{":gen":{"S":"Sci-Fi"}}' \
// --page-size 100  \
// --debug
const AWS = require("aws-sdk")

const dynamodb = new AWS.DynamoDB({
  region: 'us-east-1',
  accessKeyId: process.env.QUOTATIONS_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.QUOTATIONS_AWS_SECRET_KEY
})

const { unmarshall } = AWS.DynamoDB.Converter

async function list(TableName = "butterfly-info") {
  return new Promise((resolve, reject) => {
    const scanParams = {
      TableName,
    }
    dynamodb.scan(scanParams, function (err, data) {
        if (err) reject(err) // an error occurred
        else resolve(data.Items.map(item => unmarshall(item))) // successful response
      }
    )
  })
}

module.exports = list
