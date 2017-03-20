function getCurrentTreeData(eventData) {
	return eventData.tree.rootNode.children
}

function GET(url, callback, failback) {
	return jQuery
		.ajax(url, {
			method: 'GET',
			cache: false,
			crossDomain: true
		})
		.done(callback)
		.fail(failback)
}

function POST(url, data, callback, failback) {
	return jQuery
		.ajax(url, {
			method: 'POST',
			cache: false,
			data: data,
			crossDomain: true
		})
		.done(callback)
		.fail(failback)
}

function OrgTree2FancyTree(originNodes) {
	if (originNodes.constructor === Array) {
		var result = []

		originNodes.forEach(function (originNode) {
			var tmpNode = {
				title: originNode.department,
				folder: true,
				position: false,
				children: originNode.position.map(function (nameLevel) {
					return {
						title: nameLevel.name + '@' + (nameLevel.level === '' ? '空白' : nameLevel.level),
						position: true
					}
				})
			}

			if (originNode.children.length > 0) {
				tmpNode.children = tmpNode.children.concat(OrgTree2FancyTree(originNode.children))
			}

			result.push(tmpNode)
		})

		return result
	} else {
		return OrgTree2FancyTree([originNodes])
	}
}

function FancyTree2OrgTree(nodes, parentNode) {
	var result = []

	nodes.forEach(function (node) {
		// 當遇到是 職稱 時
		if (node.data.position === true && node.folder !== true) {
			if (parentNode === undefined) {
				return console.log('fuck!')
			}

			var nameLevel = node.title.split('@')

			parentNode.position.push({
				name: nameLevel[0],
				level: nameLevel[1]
			})
		} else if (node.data.position !== true && node.folder === true) { // 當遇到是 部門 時
			var tmpNode = {
				department: node.title,
				position: [],
				children: []
			}

			if (node.children !== null && node.children !== undefined && node.children.length > 0) {
				tmpNode.children = FancyTree2OrgTree(node.children, tmpNode)
			}

			result.push(tmpNode)
		}
	})

	return result
}

function getTree() {
	GET('/get-tree', function (res) {
		console.log(res)
		var transformedTree = OrgTree2FancyTree(res)
		console.log(transformedTree)
		loadTree(transformedTree)
	})
}

function updateTree(orgtree) {
	POST('/update-tree', {
		tree: JSON.stringify(orgtree)
	}, function (res) {
		console.log('updateTree', res)
	})
}

function loadTree(fancytreeData) {
	jQuery('#tree').fancytree({
		extensions: ['edit'],
		edit: {
			inputCss: {
				minWidth: '10em'
			},
			triggerStart: ['f2'],
			close: function (ev, data) {
				if (data.save) {
					var orgtree = FancyTree2OrgTree(getCurrentTreeData(data))
					updateTree(orgtree)
				}
			}
		},
		keydown: function (ev, data) {
			// DELETE
			if (ev.keyCode === 46) {
				if (confirm('確定要刪除 ' + data.node.title + ' 嗎?')) {
					data.node.remove()
					var orgtree = FancyTree2OrgTree(getCurrentTreeData(data))
					updateTree(orgtree)
				}
			}

			// INSERT NEW POSITION "p"
			if (ev.keyCode === 80) {
				if (data.node.data.position === true) {
					// GET INDEX
					var tmpIndex = -1
					for (var i = 0; i < data.node.parent.children.length; i++) {
						if (data.node.title === data.node.parent.children[i].title) {
							tmpIndex = i + 1
							break
						}
					}

					if (tmpIndex === -1) {
						return data.node.parent.addChildren([{
							title: '職位@職務級別',
							position: true
						}])
					}

					data.node.parent.addChildren([{
						title: '職位@職務級別',
						position: true
					}], tmpIndex)
				}

				if (data.node.data.position === false) {
					if (data.node.children === null || data.node.children === undefined) {
						return data.node.addChildren([{
							title: '職位@職務級別',
							position: true
						}])
					}

					// GET INDEX (因為希望職位集中在前面，所以要抓到第一個不是職位的 index)
					var tmpIndex_ = -1
					for (var j = 0; j < data.node.children.length; j++) {
						if (data.node.children[j].data.position === false) {
							tmpIndex_ = j
							break
						}
					}

					if (tmpIndex_ === -1) {
						return data.node.addChildren([{
							title: '職位@職務級別',
							position: true
						}])
					}

					data.node.addChildren([{
						title: '職位@職務級別',
						position: true
					}], tmpIndex_)
				}
			}

			// INSERT NEW DEPARTMENT "q"
			if (ev.keyCode === 81) {
				var tmpNode = [{
					title: '新機關',
					position: false,
					folder: true,
					children: [{
						title: '職位@職務級別',
						position: true
					}]
				}]

				if (data.node.data.position === true) {
					data.node.parent.addChildren(tmpNode)
				}

				if (data.node.data.position === false) {
					data.node.addChildren(tmpNode)
				}
			}
		},
		source: fancytreeData
	})

	jQuery('#addNewDepartmentOutside').on('click', function () {
		var root = jQuery('#tree').fancytree('getRootNode')

		var tmpNode = [{
			title: '新機關',
			position: false,
			folder: true,
			children: [{
				title: '職位@職務級別',
				position: true
			}]
		}]

		root.addChildren(tmpNode)
	})

	var root = jQuery('#tree').fancytree('getRootNode')
	root.children[0].setExpanded(true)
	root.children[0].setFocus(true)
}
