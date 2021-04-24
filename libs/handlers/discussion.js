const logger = require("../utils/logger")
const discussionApi = require('../apis/index.js')['discussion']
const _ = require('lodash');

const discussionDictionary = {}

module.exports = {
  save(discussionInfo) {
    if (discussionInfo.tagName) {
      discussionDictionary[discussionInfo.tagName] = _.cloneDeep(discussionInfo.discussionData)
      // 修正isProcess: 使用tagName存储时候就不是过程job了
      discussionDictionary[discussionInfo.tagName]['isProcess'] = false
    } 
    discussionDictionary[discussionInfo.pipelineId] = _.cloneDeep(discussionInfo.discussionData)
  },
  get(tagName) {
    console.log('discussionDictionary的key', Object.keys(discussionDictionary))
    return discussionDictionary[tagName]
  },
  remove(tagName) {
    console.log('要删除：' + tagName + '删除前：discussionDictionary的key', Object.keys(discussionDictionary))
    delete discussionDictionary[tagName]
    console.log('删除后：discussionDictionary的key', Object.keys(discussionDictionary))
  },
  clear() {
    //TODO:清理超时的discussData 两天以上的
  },
  createDiscussion(body = {}, content, cb) {
    const data = {
      projectId: body?.project?.id || body?.projectId,
      mergerequestId: body?.object_attributes?.iid || body?.mergerequestId,
      content: content || '回复的信息走丢了……'
    }
    discussionApi.create(data).then(res => {
      cb && cb(null)
    }).catch(e => {
      logger.error('创建discussion 失败', e, data?.content)
      cb && cb(e)
    })
  },
  replyDiscussion(body = {}, content, cb) {
    const data = {
      projectId: body?.project?.id || body?.projectId,
      mergerequestId: body?.merge_request?.iid || body?.mergerequestId,
      discussionId: body?.object_attributes?.discussion_id || body?.discussionId,
      noteId: body?.object_attributes?.id || body?.noteId,
      content: content || '回复的信息走丢了……'
    }
    discussionApi.reply(data).then(res => {
      cb && cb(null)
    }).catch(e => {
      logger.error('创建reply 失败', e, data?.content)
      cb && cb(e)
    })
  }
}