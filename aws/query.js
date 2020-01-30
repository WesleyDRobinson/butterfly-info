import AWS from "aws-sdk"

const dynamodb = new AWS.DynamoDB({
  region: 'us-east-1',
  accessKeyId: process.env.QUOTATIONS_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.QUOTATIONS_AWS_SECRET_KEY
})

const { unmarshall } = AWS.DynamoDB.Converter

export default async function query(params, TableName = "butterfly-info") {
  return new Promise((resolve, reject) => {
    const { subjects = ['butterfly-info'] } = params

    const queryParams = {
      TableName,
      ExpressionAttributeValues: {
        ":subject": {
          "L": subjects.map(subject => ({ "S": subject })),
        }
      },
      KeyConditionExpression: "id = :id",
      ProjectionExpression: 'id, image, category, description, segmentation'
    }

    dynamodb.query(queryParams, function (err, data) {
      if (err) reject(err) // an error occurred
      else resolve(unmarshall(data.Item)) // successful response
    })
  })
}
