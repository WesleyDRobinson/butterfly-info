const AWS = require('aws-sdk')
const s3 = new AWS.S3({
  region: 'us-east-1',
  accessKeyId: process.env.DYNAMODB_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.DYNAMODB_AWS_SECRET_KEY
})

const categories = {
  '001': 'Danaus plexippus',
  '002': 'Heliconius charitonius',
  '003': 'Heliconius erato',
  '004': 'Junonia coenia',
  '005': 'Lycaena phlaeas',
  '006': 'Nymphalis antiopa',
  '007': 'Papilio cresphontes',
  '008': 'Pieris rapae',
  '009': 'Vanessa atalanta',
  '010': 'Vanessa cardui',
}

/**
 * Butterfly Model

 {
    id: '',
    image: '',
    category: {
      id: '',
      name: '',
    },
    description: {
      'scientific': '(Latin) name of the butterfly',
      'common': '(English) name of the butterfly',
      'textual': 'description of the butterfly from eNature.com',
    },
    segmentation: ''
  }

 */

async function parseDescription(Key, descriptions, categoryId) {

  return new Promise(function (resolve, reject) {
      // return memoized data if present
      if (parseDescription[categoryId]) {
        console.log('memo used')
        resolve(parseDescription[categoryId])
      }

      const [description] = descriptions.filter(desc => {
        const check = desc.Key.slice(13, 16)
        return check === categoryId
      })

      s3.getObject({
        Bucket: 'butterfly-info',
        Key: description.Key
      }, (err, text) => {
        if (err) reject(err)

        const [
          scientific,
          common,
          textual
        ] = text.Body.toString().split('\n')

        parseDescription[categoryId] = {
          scientific,
          common,
          textual
        }

        resolve(parseDescription[categoryId])
      })

    }
  )
}

async function getSegmentations(id, list) {
  return list.reduce((acc, check) => {
    const valid = check.Key.includes(id)
    if (valid) {
      acc.push(check.Key)
    }
    return acc
  }, [])
}

async function get(Prefix) {
  return new Promise((resolve, reject) => {
    s3.listObjectsV2({
      Bucket: 'butterfly-info',
      Prefix
    }, function (err, data) {
      if (err) reject(err)
      else {
        console.log('retrieved', data.Prefix)
        if (data.KeyCount < 1000) {
          resolve(data.Contents)
        } else {
          reject(new Error('expected fewer than 1000 objects, pagination is on the roadmap'))
        }
      }
    })
  })
}

async function getButterflyInfo() {
  const images = await get('images');
  const descriptions = await get('descriptions');
  const segmentations = await get('segmentations');

  const index = await Promise.all(images.slice(1, 100).map(async ({ Key }) => {
    const categoryId = Key.slice(7, 10)
    const id = `butterfly-${Key.slice(7, 14)}`

    const description = await parseDescription(Key, descriptions, categoryId)

    const [segmentation] = await getSegmentations(Key.slice(7, 14), segmentations)

    return {
      id,
      path: Key,
      category: {
        id: categoryId,
        name: categories[categoryId],
        description
      },
      segmentation
    }
  }))

  return index
}

module.exports = getButterflyInfo
