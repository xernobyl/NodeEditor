(() => {
	var canvas = null
	var ctx = null

	const style = {
		font: '15px "Baloo Tammudu"',
		padding: 15,
	}

	class Box {
		constructor(name, inputs, outputs) {
			this.name = name
			this.inputs = this.parse(name, inputs)
			this.outputs = this.parse(name, outputs)
			ctx.font = style.font
			this.width = ctx.measureText(this.name).width + style.padding * 2
			this.height = this.inputs.length > this.outputs.length ? this.inputs.length : this.outputs.length
			this.height = this.height > 2 ? this.height : 2
			this.height *= style.padding

			this.position = { x: 0, y: 0 }
			this.move(Math.random() * canvas.width, Math.random() * canvas.height)
		}

		move(x, y) {
			this.position.x = x
			this.position.y = y

			for (let i in this.inputs) {
				const input = this.inputs[i]
				input.position.x = this.position.x - this.width / 2.0
				input.position.y = style.padding * i - style.padding / 2 * this.inputs.length + this.position.y + style.padding / 2
			}

			for (let i in this.outputs) {
				const output = this.outputs[i]
				output.position.x = this.position.x + this.width / 2.0
				output.position.y = style.padding * i - style.padding / 2 * this.outputs.length + this.position.y + style.padding / 2
			}
		}

		newConnector(name, type, x = 0, y = 0, connection = null) {
			return {
				name: name,
				type: type,
				position: { x: x, y: y },
				connection: connection
			}
		}

		parse(name, data) {
			if (data) {
				if (typeof data === 'string') {
					return [this.newConnector(name, data)]
				}
				if (typeof data === 'object') {
					if (data.constructor === Array) {
						return data.filter(v => 'name' in v && 'type' in v).map(v => this.newConnector(v.name, v.type))
					}
					else {
						if ('name' in data && 'type' in data) {
							return [this.newConnector(data.name, data.type)]
						}
					}
				}
			}

			return []
		}

		collision(x, y) {
			if (x >= this.position.x - this.width / 2 - style.padding / 2 && x <= this.position.x + this.width / 2 + style.padding / 2 &&
				y >= this.position.y - this.height / 2 && y <= this.position.y + this.height / 2) {

				for (let i in this.inputs) {
					const input = this.inputs[i]
					const tx = this.position.x - this.width / 2.0
					const dx = x - tx
					const ty = style.padding * i - style.padding / 2 * this.inputs.length + this.position.y + style.padding / 2
					const dy = y - ty

					if (Math.sqrt(dx * dx + dy * dy) <= style.padding / 2) {
						//console.log('input: ' + input.name)
						return input
					}
				}
	
				for (let i in this.outputs) {
					const output = this.outputs[i]
					const tx = this.position.x + this.width / 2.0
					const dx = x - tx
					const ty = style.padding * i - style.padding / 2 * this.outputs.length + this.position.y + style.padding / 2
					const dy = y - ty

					if (Math.sqrt(dx * dx + dy * dy) <= style.padding / 2) {
						//console.log('output: ' + output.name)
						return output
					}
				}
	
				if (x >= this.position.x - this.width / 2 && x <= this.position.x + this.width / 2)
				{
					//console.log('box: ' + this.name)
					return this
				}
			}

			return null
		}

		draw() {
			ctx.fillStyle = '#fff'
			ctx.rect(this.position.x - this.width / 2.0, this.position.y - this.height / 2.0, this.width, this.height)
			ctx.stroke()
			ctx.fill()

			ctx.font = style.font
			ctx.textAlign = 'center'
			ctx.textBaseline = 'middle'
			ctx.fillStyle = '#000'
			ctx.fillText(this.name, this.position.x, this.position.y + style.padding / 2)

			const y = this.position.y
			const h = this.height
			ctx.fillStyle = '#fff'

			for (let i in this.inputs) {
				const input = this.inputs[i]
				const l = this.inputs.length

				ctx.beginPath()
				ctx.arc(this.position.x - this.width / 2.0, style.padding * i - style.padding / 2 * l + y + style.padding / 2, style.padding * 2.0 / 8.0, 0.0, 2.0 * Math.PI)

				if (input.connection) {
					ctx.fill()

					ctx.beginPath()
					ctx.moveTo(input.position.x, input.position.y)
					ctx.lineTo(input.connection.position.x, input.connection.position.y)
					ctx.stroke()
				}
				else {
					ctx.stroke()
					ctx.fill()
				}
			}

			for (let i in this.outputs) {
				const output = this.outputs[i]
				const l = this.outputs.length

				ctx.beginPath()
				ctx.arc(this.position.x + this.width / 2.0, style.padding * i - style.padding / 2 * l + y + style.padding / 2, style.padding * 2.0 / 8.0, 0.0, 2.0 * Math.PI)

				if (output.connection) {
					ctx.fill()
				}
				else {
					ctx.stroke()
					ctx.fill()
				}
			}
		}
	}

	window.onload = () => {
		canvas = document.createElement('canvas')
		canvas.style.position = 'fixed'
		canvas.style.top = 0
		canvas.style.right = 0
		canvas.style.bottom = 0
		canvas.style.left = 0
		canvas.style.width = '100%'
		canvas.style.height = '100%'

		const cursorState = {
			dragging: null,
			connecting: null,
			currentTarget: null,
		}

		canvas.onmousemove = event => {
			if (cursorState.dragging) {
				cursorState.dragging.move(event.offsetX, event.offsetY)
				draw()
				return
			}

			for (let i in boxes) {
				const box = boxes[i]
				const collision = box.collision(event.offsetX, event.offsetY)

				if (collision) {
					cursorState.currentTarget = collision
					canvas.style.cursor = 'grab'
					break
				}
			}
		}

		canvas.onmousedown = event => {
			if (cursorState.currentTarget) {
				if (cursorState.currentTarget.constructor === Box) {
					cursorState.dragging = cursorState.currentTarget
					canvas.style.cursor = 'grabbing'
				}
				else {
					cursorState.connecting = cursorState.currentTarget
					console.log('connecting')
				}
			}
		}

		canvas.onmouseup = event => {
			if (cursorState.dragging) {
				cursorState.currentTarget = cursorState.dragging
				cursorState.dragging = null
			}

			if (cursorState.connecting) {
				if (cursorState.currentTarget.constructor !== Box) {
					cursorState.connecting.connection = cursorState.currentTarget
					cursorState.currentTarget.connection = cursorState.connecting
					console.log('connected')
				}
				cursorState.connecting = null

				draw()
			}

			if (cursorState.currentTarget) {
				canvas.style.cursor = 'grab'
			}
			else {
				canvas.style.cursor = 'default'
			}
		}

		document.body.appendChild(canvas)

		canvas.width = canvas.offsetWidth
		canvas.height = canvas.offsetHeight
		ctx = canvas.getContext('2d')
	
		let boxes = []

		boxes.push(new Box('multiple', [{
			name: 'i_a',
			type: 'float'
		}, {
			name: 'i_b',
			type: 'float'
		}, {
			name: 'i_c',
			type: 'float'
		}], [{
			name: 'o_a',
			type: 'float'
		}, {
			name: 'o_b',
			type: 'float'
		}]))
		
		boxes.push(new Box('light_color', null, 'vec3'))
		boxes.push(new Box('cube_size', null, 'float'))
		boxes.push(new Box('output_color', 'float', null))

		function draw() {
			ctx.clearRect(0, 0, canvas.width, canvas.height)
			for (let i in boxes) {
				const box = boxes[i]
				box.draw()
			}
		}

		draw()

		let f = new FontFace('Baloo Tammudu', 'url(https://fonts.googleapis.com/css?family=Baloo+Tammudu)')
		f.load().then(function() {
			draw()
		})
	}
})()
