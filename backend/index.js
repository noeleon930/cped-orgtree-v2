'use strict'

const path = require('path')

const jsonfile = require('jsonfile')

const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const compression = require('compression')
const bodyParser = require('body-parser')
const morgan = require('morgan')

let GLOBAL_ORG_TREE = require('../data/all.json')

const app = express()

app.use(helmet())
app.use(cors())
app.use(compression())
app.use(bodyParser.json({
	limit: '64mb'
}))
app.use(bodyParser.urlencoded({
	extended: true,
	limit: '64mb'
}))
app.use(morgan('common'))
app.use(express.static(path.join(__dirname, '..', 'frontend')))

let lock = false

app.post('/update-tree', (req, res) => {
	lock = true

	GLOBAL_ORG_TREE = JSON.parse(req.body.tree)

	jsonfile.writeFile(path.join(__dirname, '..', 'data', 'all.json'), GLOBAL_ORG_TREE, err => {
		if (err) {
			console.error(err)
			return res.status(500).send(err)
		}

		res.status(201).json({
			status: 'good'
		})

		lock = false
	})
})

app.get('/get-tree', (req, res) => {
	let task = () => {
		if (lock === true) {
			return setTimeout(task, 100)
		} else {
			return res.status(200).json(GLOBAL_ORG_TREE)
		}
	}

	task()
})

app.listen(10800)
