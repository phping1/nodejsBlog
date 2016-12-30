var express = require('express');
var crypto = require('crypto')
var User = require('../models/user.js')
var Post = require('../models/post.js')
var router = express.Router();

/* GET home page. */
exports.index = function (req, res) {
  Post.get(null,function (err,posts) {
    if (err) {
      posts = []
    }
    res.render('index',
    {
      title: '首页',
      posts : posts,
			user : req.session.user,
			success : req.flash('success').toString(),
			error : req.flash('error').toString()
    })
  })

}
exports.reg = function (req, res) {
    res.render('reg', { title: '用户注册' });
}
exports.doReg = function(req, res) {
  //检查密码
    if (req.body['password-repeat'] != req.body['password']) {
  		req.flash('error', '两次输入的密码不一致')
  		return res.redirect('/reg')
    }

    //生成md5的密码
    var md5 = crypto.createHash('md5')
    var password = md5.update(req.body.password).digest('base64')

    var newUser = new User({
      name : req.body.username,
      password : password
    })

    // 检查用户名是否已经存在
    User.get(newUser.name,function (err,user) {
      if (user)
        err = 'Username already exists'
      if (err) {
        req.flash('error',err)
        return res.redirect('/reg')
      }

      // 如果不存在则新增用户
      newUser.save(function (err) {
        if (err) {
          req.flash('error',err)
          return res.redirect('/reg')
        }
        req.session.user = newUser
        req.flash('success','注册成功')
        res.redirect('/')
      })
    })

}

exports.login = function (req,res) {
  res.render('login',{
    title : '用户登录',
    user : req.session.user,
    success : req.flash('success').toString(),
    error : req.flash('error').toString()
  })
}

exports.doLogin = function (req,res) {
  // 生成散列值
  var md5 = crypto.createHash('md5')
  var password = md5.update(req.body.password).digest('base64')

  User.get(req.body.username,function (err,user) {
    // console.dir(user)

    if (!user) {
			req.flash('error', '用户不存在')
      return res.redirect('/')
			// return res.redirect('/login')
		}
    if (user.password != password) {
			req.flash('error', '密码错误')
      // return res.redirect('/login')
      return res.redirect('/')
		}

    req.session.user = user;
		req.flash('success', '登录成功');
		res.redirect('/');
  })
}

exports.publish = function (req,res) {
  var currentUser = req.session.user
  var post = new Post(currentUser.name,req.body.post)
  post.save(function (err) {
    if (err) {
      req.flash('error',err)
      return res.redirect('/')
    }
    req.flash('success','发表成功')
    res.redirect('/u/' + currentUser.name)
  })
}

exports.show = function (req,res) {
  User.get(req.params.user,function (err,user) {
    if (!user) {
      req.flash('error','用户不存在')
      return redirect('/')
    }
    Post.get(user.name,function (err,posts) {
      if (err) {
        req.flash('error',err)
        return res.redirect('/')
      }

      res.render('user',{
        title : user.name,
        posts: posts,
				user : req.session.user,
				success : req.flash('success').toString(),
				error : req.flash('error').toString()
      })
    })
  })
}

exports.checkLogin = function (req,res,next) {
  if (!req.session.user) {
    req.flash('error','未登陆')
    return res.redirect('/login')
  }
  next()
}

exports.checkNotLogin = function (req,res,next) {
  if (req.session.user) {
    req.flash('error','已登入')
    return res.redirect('/')
  }
  next()
}

exports.logout =  function(req,res) {
  req.session.user = null;
  req.flash('success','退出成功')
  res.redirect('/')
}
// module.exports = router
