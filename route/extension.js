/*
 * 用来承接chrome插件的接口
 * 隐蔽掉feci的token，防止泄漏
 */
const express = require('express');
const router = express.Router();
const api = require('../libs/apis/index')
const logger = require('../libs/utils/logger.js')

// 获取所有project
router.get('/projects/all', function(req, res) {
  api.projects.get()
  .then((result) => {
    res.json(result)
  }, err => {
    res.status(400).send(err)
  })
});

// 创建项目
router.post('/projects/create', function(req, res) {
  api.projects.create(req.body)
    .then((result) => {
      res.json(result)
    }, err => {
      res.status(400).send(err)
    })
})

// 创建变量
router.post('/projects/variables/create', function(req, res) {
  api.projects.variables.create(req.body)
    .then((result) => {
      res.json(result)
    }, err => {
      res.status(400).send(err)
    })
})

// 创建triggerToken
router.post('/projects/triggers/create', function(req, res) {
  api.projects.triggers.create(req.body)
    .then((result) => {
      res.json(result)
    }, err => {
      res.status(400).send(err)
    })
})

// 创建hooks
router.post('/projects/hooks/create', function(req, res) {
  api.projects.hooks.create(req.body)
    .then((result) => {
      res.json(result)
    }, err => {
      res.status(400).send(err)
    })
})

// 创建分支
router.post('/branches/create', function(req, res) {
  api.branches.create(req.body)
    .then((result) => {
      res.json(result)
    }, err => {
      res.status(400).send(err)
    })
})

// 获取所有组别
router.get('/groups/all', function(req, res) {
  api.groups.all()
  .then(result => {
    res.json(result)
  }, err => {
    res.status(400).send(err)
  })
})



// extension根路由
router.get('/', function(req, res) {
  res.status(400).send('路由不正确')
});


module.exports = router;
