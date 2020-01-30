const AWS = require('aws-sdk')

const dynamodb = new AWS.DynamoDB({
  region: 'us-east-1',
  accessKeyId: process.env.QUOTATIONS_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.QUOTATIONS_AWS_SECRET_KEY
})

const { marshall } = AWS.DynamoDB.Converter

exports.batchUpload = function batchUpload(array, tableName, batchSize = 20) {
  const batchParams = {
    RequestItems: {
      [tableName]: []
    }
  }

  const batch = Object.assign({}, batchParams)
  array.forEach((keyObject, i, arr) => {
    const Item = marshall(keyObject)
    const putReq = {
      PutRequest: {
        Item,
      }
    }

    batch.RequestItems[tableName].push(putReq)

    if ((i + 1) % batchSize === 0 || (i + 1) === arr.length) {
      flush({ batch, tableName })
      batch.RequestItems[tableName] = []
    }
  })
}

function flush({ batch, tableName }) {
  console.log(`flushing ${batch.RequestItems[tableName].length} items`)

  dynamodb.batchWriteItem(batch, function (err, data) {
    if (err) console.error(err)
    else console.log(data)
  })
}

// node.js usage... uncomment the following and execute this file with node!

// (async () => {
//   const getButterflyInfo = require('./uploads/butterfly-info.js')
//   const butterflyInfo = await getButterflyInfo()
//   exports.batchUpload(butterflyInfo, 'butterfly-info')
// })()
