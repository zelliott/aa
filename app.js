/*
 * Module dependencies
 */
var express = require('express')
  , stylus = require('stylus')
  , nib = require('nib')


var app = express()

function compile(str, path) {
  return stylus(str)
    .set('filename', path)
    .use(nib());
}

app.set('views', __dirname + '/views')
app.set('view engine', 'jade')
app.use(express.logger('dev'))
app.use(stylus.middleware(
  { src: __dirname + '/public'
  , compile: compile
  }
))
app.use(express.static(__dirname + '/public'))

app.get('/today/interviewer', function (req, res) {
  res.render('today_interviewer',
{ title : 'Today' }
)
})

app.get('/today/hr', function (req, res) {
  res.render('today_hr',
{ title : 'Today' }
)
})

app.get('/candidate', function (req, res) {
  res.render('candidate',
{ title : 'Candidate View' }
)
})

app.get('/candidates', function (req, res) {
  res.render('candidates',
{ title : 'All Candidates View' }
)
})

app.get('/', function (req, res) {
  res.render('process',
{ title : 'Recruiting Overview' }
  )
})

app.listen(process.env.PORT || 3000)
