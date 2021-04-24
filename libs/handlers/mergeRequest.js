const Util = require("../utils");
const logger = require("../utils/logger");
const moment = require("moment");
const _ = require("lodash");
const discussionHandler = require("./discussion");
const pipelineApi = require("../apis/index.js")["pipeline"];

function mergerequestHandler(body = {}) {
  console.log("mrHandler", body);
  const command = Util.parseArgv(body?.object_attributes?.description);
  if (!command || command.nameSpace !== `/${process.env.COMMAND_PREFIX}`) {
    logger.warn(`无指令，或命名空间不正确: ${command?.nameSpace}`);
    return;
  }
  if (body?.object_attributes?.state !== "merged") {
    logger.warn(`未merge，不能执行指令`);
    return;
  }
  // 其他action的扩展位置
  switch (command.action) {
    case "tag":
      tag(body, command);
      break;
    case "publish":
      publish(body, command);
    default:
      return;
  }
}

function tag(body, command) {
  const object_attributes = body?.object_attributes;
  // 目标分支是否为release分支
  if (!Util.checkCanTagBranch(object_attributes?.target_branch)) {
    logger.warn("可打tag分支：release/*, custom/*");
    discussionHandler.createDiscussion(
      body,
      `可打tag分支：release/*, custom/*`
    );
    return;
  }
  const {
    target_branch: targetBranch,
    target_project_id: projectId,
  } = object_attributes;
  const tagDes = command.description || command.d || targetBranch.split("/")[1];
  const userName = body?.object_attributes?.last_commit?.author?.name || "feci";
  const timeStamp = `${moment().format("YYYYMMDDHHmmss")}`;
  const projectName = body?.project?.name || "noname";
  let tagName =
    command.fullName || command.f || `${projectName}_${tagDes}_${timeStamp}`;
  tagName = tagName.replace(/-/g, "_").toLowerCase();
  if (!Util.checkTagName(tagName)) {
    discussionHandler.createDiscussion(
      body,
      `${userName} 在 ${body?.project?.name} 项目的tag不符合规范：${tagName}（必须是数字小写字母下划线或点）`
    );
    return;
  }
  logger.info(targetBranch, projectId, tagName);
  const postData = {
    Z_BRANCH: targetBranch,
    Z_TAG_NAME: tagName,
  };
  // 触发打tag的流水线
  pipelineApi
    .create({ projectId, targetBranch, postData })
    .then(
      (res) => {
        const pipelineUrl = body?.project?.web_url + `/pipelines/${res.id}`;
        discussionHandler.createDiscussion(
          body,
          `${userName} 在 ${
            body?.project?.name
          } 项目的打tag构建开始了，一会回来看看tag吧   ${Util.createEmoji()}\[点此查看流水线\]\(${pipelineUrl}\)`
        );
        // 保存pipeline相关信息以及当前的discussion，然后使用pipeline的状态来处理
        logger.info(
          `${userName} 在 ${targetBranch}打tag的job触发成功：tagDes：${tagDes}`
        );
        // 保存当前note相关信息：projectId, mergerequestId, discussionId, noteId: object_attributes.id, content,
        let discussionData = {
          projectId: body.project.id,
          mergerequestId: body.object_attributes.iid,
          type: "create",
          tag: tagName,
          isProcess: true,
          successMessage: `构建成功，tag是：${tagName}`,
          failMessage: `${userName} 在 ${body?.project?.name} 项目的构建失败了`,
        };
        discussionHandler.save({
          pipelineId: res.id,
          tagName,
          discussionData,
        });
      },
      (e) => {
        discussionHandler.createDiscussion(
          body,
          `${userName} 在 ${body?.project?.name} 项目打tag任务触发失败`
        );
        logger.error(`${userName} 在 ${targetBranch}打tag的job触发失败`, e);
      }
    )
    .catch((e) => {
      logger.error(e);
    });
}

function publish(body, command) {
  const {
    target_branch: targetBranch,
    target_project_id: projectId,
  } = body?.object_attributes;
  const userName = body?.user?.name || "feci";
  const distTag = command.t || command.tag;
  const isPreRelease = command.p || command.prePublish;
  const isMajor = command.m || command.major;
  // 目标分支是否为release分支
  if (
    !Util.checkReleaseBranch(targetBranch) &&
    !Util.checkMasterBranch(targetBranch)
  ) {
    logger.warn("发布分支不符合要求：master或release");
    discussionHandler.createDiscussion(
      body,
      `发布分支不符合要求：master或release`
    );
    return;
  }
  // release必与tag同时；master必无参
  if (
    !(
      (Util.checkReleaseBranch(targetBranch) && isPreRelease) ||
      (Util.checkMasterBranch(targetBranch) && !isPreRelease)
    )
  ) {
    logger.warn(
      "release分支发布必须指定prePublish参数(-p 或 --prePublish）：发孤版；master分支必不能带prePublish参数"
    );
    discussionHandler.createDiscussion(
      body,
      `release分支发布必须指定prePublish参数(-p 或 --prePublish）：发孤版；master分支必不能带prePublish参数`
    );
    return;
  }

  const postData = {
    Z_CI_OP: isPreRelease ? "pre_publish" : "publish",
  };
  if (typeof isPreRelease === "string") {
    postData.Z_NPM_PREFIX = isPreRelease;
  }
  if (distTag) {
    postData.Z_NPM_TAG_NAME = distTag;
  }
  if (isMajor) {
    postData.Z_NPM_MAJOR = "true";
  }
  pipelineApi
    .create({ projectId, targetBranch, postData })
    .then(
      (res) => {
        const pipelineUrl = body?.project?.web_url + `/pipelines/${res.id}`;
        discussionHandler.createDiscussion(
          body,
          `${userName} 在 ${
            body?.project?.name
          } 项目的npm包发布开始了   ${Util.createEmoji()}\[点此查看流水线\]\(${pipelineUrl}\)`
        );
        // logger.info(`${userName} 在 ${targetBranch}打tag的job触发成功：tagDes：${tagDes}`, res)
        // 保存当前note相关信息：projectId, mergerequestId, discussionId, noteId: object_attributes.id, content,
        let discussionData = {
          projectId: body.project.id,
          mergerequestId: body.object_attributes.iid,
          type: "create",
          isProcess: false,
          successMessage: `${userName} 在 ${body?.project?.name} 项目的npm包发布成功了`,
          failMessage: `${userName} 在 ${body?.project?.name} 项目的npm包发布失败了`,
        };
        discussionHandler.save({
          pipelineId: res.id,
          discussionData,
        });
      },
      (e) => {
        logger.error(e);
        discussionHandler.createDiscussion(
          body,
          `${userName} 在 ${body?.project?.name} 项目npm发布任务触发失败 <br/> <br/> 原因：${e}`
        );
        logger.warn(
          `${userName} 在 ${body?.project?.name} 项目npm发布任务触发失败 <br/> <br/> 原因：${e}`
        );
      }
    )
    .catch((e) => {
      logger.error(e);
    });
}

module.exports = mergerequestHandler;
