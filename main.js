//load libraries
const express = require('express')
const handlebars = require('express-handlebars')
//get the driver with promise support
const mysql = require('mysql2/promise')

//SQL
const SQL_FIND_BY_NAME = 'select * from apps where name like ? limit ?'
const SQL_FIND_BY_APP_ID = 'select *'
//configure PORT
const PORT = parseInt(process.argv[2]) || parseInt(process.env.PORT) || 3000

//create the database connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    database: process.env.DB_NAME || 'playstore',
    user: process.env.DB_USER, //don't have a default user
    password: process.env.DB_PASSWORD,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 4,
    timezone: '+08:00'  
})

//check if the pool is up
const startApp = async (app, pool) => {
    
    try{
        //acquire a connection from the connection pool
        const conn = await pool.getConnection()

        console.info('Pinging database')
        await conn.ping()

        //release the connection
        conn.release()

        //start the server
        app.listen(PORT, () => {
            console.info(`Application started on port ${PORT} at ${new Date()}`)
        })

    } catch(e) {
        console.error('Cannot ping database: ', e)
    }
}

//create an instance of the application
const app = express()

//configure handlebars
app.engine('hbs', handlebars({ defaultLayout: 'default.hbs'}))
app.set('view engine', 'hbs')

//configure the application
app.get('/', (req, resp) => {
    resp.status(200)
    resp.type('text/html')
    resp.render('index')
})

app.get('/search', 
    async (req, resp) =>  {  
    const q = req.query['q']
    
    //acquire a connection from the pool
    const conn = await pool.getConnection()

    try {
        //perform the query
        //const [ recs, _ ] = await conn.query(SQL_FIND_BY_NAME, [ `%${q}%`, 10 ]) 
        const result = await conn.query(SQL_FIND_BY_NAME, [ `%${q}%`, 10 ])
        const recs = result[0]

        console.info('recs = ', recs)
        resp.status(200)
        resp.type('text/html')
        resp.render('results', { 
            recs,
            hasResults: recs.length>0 
        })

    } catch(e) {    
    } finally {
        //release connection
        await conn.release()
    }

    console.info('Search term: ', q )

})


//app.use(express.static(__dirname + '/static'))

startApp(app, pool)
//start the application

   // console.info(`User name: ${DB_USER}`)
