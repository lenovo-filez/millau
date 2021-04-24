const noteHandler = require('./note.js')
const pipelineHandler = require('./pipeline.js')
const discussionHandler = require('./discussion.js')
const mergeRequestHandler = require('./mergeRequest.js')

const handlers = {
    note: noteHandler,
    pipeline: pipelineHandler,
    discussion: discussionHandler,
    merge_request: mergeRequestHandler
}

module.exports = handlers