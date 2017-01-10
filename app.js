var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var partials = require('express-partials');

var settings = require('./setting')
var session = require('express-session')
var MongoStore = require('connect-mongo')(session)
var methodOverride = require('method-override');
var flash = require('connect-flash')

var indexRouter = require('./routes/index')
var userRouter = require('./routes/user')

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.set('trust proxy', 1) // trust first proxy
app.use(require('body-parser').urlencoded({extended: true}))
app.use(methodOverride())
app.use(cookieParser())
// 提供会话支持，设置它的store参数为MongoStore实例，把会话信息存储到数据库中去，以避免数据丢失
app.use(session({
  secret : settings.cookieSecret,
  cookie : {
    maxAge : 60000 * 20	//20 minutes
  },
  store : new MongoStore({
    db : settings.db,
    url : 'mongodb://localhost/microblog'
  }),
  resave : false,
  saveUninitialized : false,
}))

app.use(flash());

// express.static是内置的中间件
// express.static(root,[options]) 这个函数是基于为静态,并负责提供静态资产如HTML文件,图片,等等。
// root参数指定静态文件的根目录
app.use(express.static(__dirname + '/public'))

// 启用layout
app.use(partials());
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req, res, next){
  console.log("app.usr local");
  res.locals.user = req.session.user;
  res.locals.post = req.session.post;
  next();
});

// 写公共的路由中间件
// 判断访问该路由的权限
var filterRoute = function (req,res,next) {
  // 如果已经登录过，则不能再访问登录页或注册页
  if (req.path == '/login' || req.path == '/reg') {
    if (req.session.user) {
      req.flash('error','已登入')
      return res.redirect('/')
    }
    next()
  }
  // 如果没有登录，则不能查看显示微博信息的页面
  else if (req.path.match(/^\/u\/\w*/)) {
    if (!req.session.user) {
      req.flash('error','未登陆')
      return res.redirect('/login')
    }
    next()
  }
  else next()
}
app.use(filterRoute)
// route start......
app.use(indexRouter) // 意味着对/路径下的所有URL请求都会进行判断
app.use(userRouter)

// 存放flash,赋给全局变量 注:必须放在route后面，否则比如在login的时候，如果用户名或密码错误，则看不到提示
app.use(function(req, res, next){
  console.log("To deal with global session");
  var error = req.flash('error');
  res.locals.error = error.length ? error : null;
  var success = req.flash('success');
  res.locals.success = success.length ? success : null;
  next();
});
// route end......

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err); // 如果使用了 next(error)，则会返回错误而不会传递到下一个中间件;
  // next('router') // 如果调用next('router')，则会跳过当前路由的其它中间件，直接将控制权交给下一个路由
})

// error handler
// 处理所有error请求,并加载error页面，显示错误信息
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.render('error', {
    title : 'Not Found',
    error : err
  })
});

module.exports = app;
