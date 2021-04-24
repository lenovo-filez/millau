const { Gitlab } = require("@gitbeaker/node");
const logger = require("../utils/logger");
require("dotenv").config();

console.log(`host: ${process.env.GITLAB_HOST}`);
console.log(`token: ${process.env.GITLAB_TOKEN}`);
// feci账号的token
const services = new Gitlab({
  host: process.env.GITLAB_HOST,
  token: process.env.GITLAB_TOKEN,
});

const apis = (module.exports = {
  pipeline: {
    create: async function ({ projectId, targetBranch, postData }) {
      // 在这里重新实例化原因：
      // npm情景内，创建完新项目然后 /filez publish，一直报错400，重启服务才能解决
      // 所以在无法定位到gitbeaker的内部逻辑之前，使用重新实例化解决
      const freshInstance = new Gitlab({
        host: process.env.GITLAB_HOST,
        token: process.env.GITLAB_TOKEN,
      });
      const res = await apis.triggers.all({ projectId });
      const triggerToken = res && res[0]?.token;
      if (!triggerToken) {
        logger.warn(
          `id为 ${projectId} 的项目获取trigger token失败，联系管理员处理`
        );
        return new Promise((resolve, reject) => {
          reject(
            new Error(
              `id为 ${projectId} 的项目获取trigger token失败，联系管理员处理`
            )
          );
        });
      }
      // 获取pipeline
      return freshInstance.Triggers.pipeline(
        projectId,
        targetBranch,
        triggerToken,
        { variables: postData }
      );
    },
  },
  discussion: {
    reply({ projectId, mergerequestId, discussionId, noteId, content }) {
      return services.MergeRequestDiscussions.addNote(
        projectId,
        mergerequestId,
        discussionId,
        noteId,
        content
      );
    },
    create({ projectId, mergerequestId, content }) {
      return services.MergeRequestDiscussions.create(
        projectId,
        mergerequestId,
        content
      );
    },
  },
  tag: {
    create({ projectId, tagName, ref }) {
      return services.Tags.create(projectId, {
        tag_name: tagName,
        ref: ref,
      });
    },
  },
  projects: {
    get() {
      return services.Projects.all({ owned: true });
    },
    create(data) {
      return services.Projects.create(data);
    },
    variables: {
      create({ projectId, key, value }) {
        return services.ProjectVariables.create(projectId, {
          key,
          value,
        });
      },
    },
    triggers: {
      create({ projectId, description }) {
        return services.Triggers.add(projectId, {
          description,
        });
      },
    },
    hooks: {
      create({
        projectId,
        url,
        push_events,
        tag_push_events,
        note_events,
        merge_requests_events,
        job_events,
        pipeline_events,
        repository_update_events,
        enable_ssl_verification,
      }) {
        return services.ProjectHooks.add(projectId, url, {
          push_events,
          tag_push_events,
          note_events,
          merge_requests_events,
          job_events,
          pipeline_events,
          repository_update_events,
          enable_ssl_verification,
        });
      },
    },
  },
  branches: {
    create({ projectId, branchName, ref }) {
      return services.Branches.create(projectId, branchName, ref);
    },
  },
  triggers: {
    all({ projectId }) {
      return services.Triggers.all(projectId);
    },
  },
  groups: {
    all() {
      return services.Groups.all();
    },
  },
});
