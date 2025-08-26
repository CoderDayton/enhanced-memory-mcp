const fs = require('fs')
const path = require('path')

const handlerPath = path.join(__dirname, '..', 'mcp-handler.js')
const outPath = path.join(__dirname, '..', 'data', 'tool-schemas.json')

const content = fs.readFileSync(handlerPath, 'utf8')

// Find all validateRequired calls and associate them with the nearest function name above
// This is a heuristic parser, good enough for this codebase structure.
const lines = content.split(/\r?\n/)

const schemas = {}
let currentFunction = null
for (let i = 0; i < lines.length; i++) {
	const line = lines[i]
	const fnMatch = line.match(/^\s+async\s+(\w+)\(/)
	if (fnMatch) {
		currentFunction = fnMatch[1]
		// initialize schema entry
		schemas[currentFunction] = {
			type: 'object',
			properties: {},
			required: [],
			additionalProperties: true,
		}
		continue
	}

	const reqMatch = line.match(
		/this\.validateRequired\(args,\s*\[([^\]]*)\],\s*'([^']*)'\)/
	)
	if (reqMatch && currentFunction) {
		const fieldsRaw = reqMatch[1].trim()
		if (fieldsRaw.length > 0) {
			const fields = fieldsRaw
				.split(',')
				.map((s) => s.replace(/['"\s]/g, '').trim())
				.filter(Boolean)
			schemas[currentFunction].required.push(...fields)
			// add basic string property entries for each required
			for (const f of fields) {
				schemas[currentFunction].properties[f] = { type: 'string' }
			}
		}
	}
}

// Convert function names to tool names using mapping in constructor
// Load the constructor mapping from the file (heuristic)
const constructorIndex = content.indexOf('this.tools = {')
if (constructorIndex !== -1) {
	const slice = content.slice(constructorIndex, constructorIndex + 2000)
	const mappingLines = slice.split(/\r?\n/).slice(1)
	for (const mline of mappingLines) {
		const mapMatch =
			mline.match(/\s*(\w+):\s*this\.(\w+)\.bind\(this\),?/) ||
			mline.match(/\s*(\w+):\s*this\.(\w+)\.bind\(this\)/)
		if (mapMatch) {
			const toolName = mapMatch[1]
			const fnName = mapMatch[2]
			if (schemas[fnName]) {
				schemas[toolName] = schemas[fnName]
				delete schemas[fnName]
			} else {
				// ensure tool has a permissive schema
				schemas[toolName] = { type: 'object', additionalProperties: true }
			}
		}
	}
}

// Ensure output directory exists
fs.mkdirSync(path.dirname(outPath), { recursive: true })
fs.writeFileSync(outPath, JSON.stringify(schemas, null, 2), 'utf8')
console.log('Wrote tool schemas to', outPath)

process.exit(0)
