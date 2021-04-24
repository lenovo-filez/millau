// const { create } = require('lodash')
const logger = require('../utils/logger.js')
const discussionApi = require('../apis/index.js')['discussion']
const discussionHandler = require('./discussion')
const Util = require('../utils/index.js')
function pipelineHandler(body) {
  logger.info('pipelineHandler', body)
  this.body = body
  this.status = body?.object_attributes?.status
  this.ref = body?.object_attributes?.ref
  this.id = body?.object_attributes?.id
  console.log(`ref: ${this.ref}, id: ${this.id}`)
  this.discussionData = discussionHandler.get(this.ref) || discussionHandler.get(this.id)
  // create_tag这个job就是中间过程，如果失败了就需要报错，成功静默就可以。所以它的状态时process
  // 实际构建这种就是最终我们关注的结果，成功与否都需要提示
  this.isProcess = this.discussionData?.isProcess
  if (!this.discussionData) return
  this[this.status] && this[this.status]()
}

pipelineHandler.prototype.pending = function pending() {
  return
}

pipelineHandler.prototype.running = function running() {
  return
}

pipelineHandler.prototype.failed = function failed() {
  let content = this.discussionData.failMessage || ''
  let data = null
  const pipelineUrl = this.body?.project?.web_url + `/pipelines/${this.id}`
  content += `  ${Util.createEmoji()}\[点此查看流水线\]\(${pipelineUrl}\)`
  if (this.discussionData?.type === 'reply') {
    data = {
      projectId: this.discussionData.project.id,
      mergerequestId: this.discussionData.merge_request.iid,
      discussionId: this.discussionData.object_attributes.discussion_id,
      noteId: this.discussionData.object_attributes.id,
    }
  } else {
    data = {
      projectId: this.discussionData?.projectId,
      mergerequestId: this.discussionData?.mergerequestId,
    }
  }
  discussionHandler[`${this.discussionData.type}Discussion`](data, content, (err) => {
    if (err) {
      this.clearAll()
      logger.error(err)
      return
    }
    if (this.isProcess) {
      discussionHandler.remove(this.id)
      discussionHandler.remove(this.discussionData?.tag)
      return
    }
    this.clearAll()
  })
}

pipelineHandler.prototype.canceled = function canceled() {
  let content = '流水线已取消'
  let data = null
  const pipelineUrl = this.body?.project?.web_url + `/pipelines/${this.id}`
  content += `  ${Util.createEmoji()}\[点此查看流水线\]\(${pipelineUrl}\)`
  if (this.discussionData?.type === 'reply') {
    data = {
      projectId: this.discussionData.project.id,
      mergerequestId: this.discussionData.merge_request.iid,
      discussionId: this.discussionData.object_attributes.discussion_id,
      noteId: this.discussionData.object_attributes.id,
    }
  } else {
    data = {
      projectId: this.discussionData?.projectId,
      mergerequestId: this.discussionData?.mergerequestId,
    }
  }
  discussionHandler[`${this.discussionData.type}Discussion`](data, content, (err) => {
    this.clearAll()
  })
}

pipelineHandler.prototype.success = function success() {
  let content = this.discussionData.successMessage || ''
  let data = null
  if (this.isProcess) {
    discussionHandler.remove(this.id)
    return
  }
  if (this.discussionData?.type === 'reply') {
    data = {
      projectId: this.discussionData?.project.id,
      mergerequestId: this.discussionData?.merge_request?.iid,
      discussionId: this.discussionData?.object_attributes?.discussion_id,
      noteId: this.discussionData?.object_attributes?.id,
    }
  } else {
    data = {
      projectId: this.discussionData?.projectId,
      mergerequestId: this.discussionData?.mergerequestId,
    }
  }
  discussionHandler[`${this.discussionData?.type}Discussion`](data, content, (err) => {
    if (err) {
      logger.error(err)
      this.clearAll()
      return
    }
    if (this.isProcess) {
      discussionHandler.remove(this.id)
      return
    }
    this.clearAll()
  })
}

pipelineHandler.prototype.clearAll = function clearAll() {
  discussionHandler.remove(this.id)
  discussionHandler.remove(this.ref)
  discussionHandler.remove(this.discussionData?.tag)
}

module.exports = pipelineHandler