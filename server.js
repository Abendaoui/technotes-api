require('dotenv').config()
const express = require('express')
const app = express()
const path = require('path')
const errorHandler = require('./middlewares/errorHandler')
const mongoose = require('mongoose')
const connectDb = require('./configs/dbConnection')
const { logEvents, logger } = require('./middlewares/logger')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const corsOptions = require('./configs/corsOptions')

app.use(logger)

app.use(cors(corsOptions))

app.use(express.json())

app.use(cookieParser())

app.use('/', express.static(path.join(__dirname, 'public')))

// Routes
app.use('/', require('./routes/root'))
app.use('/auth', require('./routes/authRoutes'))
app.use('/users', require('./routes/userRoutes'))
app.use('/notes', require('./routes/noteRoutes'))

app.all('*', (req, res) => {
  res.status(404)
  if (req.accepts('html')) {
    res.sendFile(path.join(__dirname, 'views', '404.html'))
  } else if (req.accepts('json')) {
    res.json({ message: '404 Not Found' })
  } else {
    res.type('txt').send('404 Not Found')
  }
})

app.use(errorHandler)

const PORT =  5000
connectDb()

mongoose.connection.once('open', () => {
  console.log('Connection Success')
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
})

mongoose.connection.on('error', (err) => {
  console.log(err)
  logEvents(
    `${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`,
    'mongoErrLog.log'
  )
})
