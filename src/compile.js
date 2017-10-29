import dirOn from './directives/on.js'
import dirBind from './directives/bind.js'
import dirModel from './directives/model.js'

const bindRE = /^v-bind:|^:/
const onRE = /^v-on:|^@/
const modelRE = /^v-model|^@/
const dirAttrRE = /^v-([^:]+)(?:$|:(.*)$)/

export const compileDirectives = function (attrs) {
  if (!attrs) return undefined
  const dirs = []

  let i = attrs.length

  while (i--) {
    const attr = attrs[i]
    const name = attr.name
    const value = attr.value
    let arg = name
    if (name.match(dirAttrRE)) {
			if (onRE.test(name)) {
        arg = name.replace(onRE, '')
				pushDir('on', dirOn)
			} else if (bindRE.test(name)) {
        arg = name.replace(bindRE, '')
				pushDir('bind', dirBind)
			} else if (modelRE.test(name)) {
        arg = name.replace(modelRE, '')
				pushDir('bind', dirModel)
			}
    }

    function pushDir(dirName, def) {
      dirs.push({
        name: dirName,
        rawName: name,
        def: def,
        arg: arg,
        value: value,
        rawValue: value
      })
    }
  }
  if (dirs.length) return makeNodeLinkFn(dirs)
}

function makeNodeLinkFn (directives) {
  return function nodeLinkFn (vm, el) {
    // reverse apply because it's sorted low to high
    var i = directives.length
    while (i--) {
      vm._bindDir(directives[i], el)
    }
  }
}

// only for the root element
export const compile = function (el, options) {
  if (el.hasChildNodes()) return function (vm, el) {
    const nodeLink = compileNode(el, options)
    const childLink = compileNodeList(el.childNodes, options)
    nodeLink && nodeLink(vm, el)
    childLink && childLink(vm, el)
    vm._directives.forEach((v) => {
      v._bind()
    })
  }
  else return function (vm, el) {
    compileNode(el, options)
    vm._directives.forEach((v) => {
      v._bind()
    })
  }
}

function compileNodeList (nodeList, options) {
  const links = []
  for (var i=0; i<nodeList.length; i++) {
    const el = nodeList[i]
    let link = compileNode(el, options)
    link && links.push(link)
    if (el.hasChildNodes()) {
      link = compileNodeList(el.childNodes, options)
      link && links.push(link)
    }
  }

  return function (vm, el) {
    let i = links.length
    while (i--) {
      links[i](vm, el)
    }
  }
}

function compileNode (el, options) {
  return compileDirectives(el.attributes)
}
