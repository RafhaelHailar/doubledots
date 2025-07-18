import { SheetWrapper } from 'https://cdn.jsdelivr.net/gh/orstavik/csss@25.06.05/src/engine.js';

function e_() {
  const e = window.eventLoop.event;
  return e.preventDefault(), e;
}

function eDot(name) {
  const [, ...props] = name.split(".");
  return function eDot() {
    return props.reduce((acc, prop) => acc[prop], window.eventLoop.event);
  }
}

function parseStringValue(input) {
  return input?.toString instanceof Function ? input = input.toString() :
    input?.toJSON instanceof Function ? input = input.toJSON() :
    input && input instanceof Object ? input = JSON.stringify(input) :
    input;
}

function gatRule(name) {
  name = name.split(".")[1];
  return function gat() { return this.ownerElement.getAttribute(name); };
}

function sat_Rule(name) {
  name = name.split("_")[1];
  if (!name)
    return function sat_(input) { return this.value = parseStringValue(input); }
  return function sat_(input) { return this.ownerElement.setAttribute(name, parseStringValue(input)); };
}

function tat_Rule(name) {
  name = name.split("_")[1];
  if (!name)
    throw new SyntaxError("In :DD you can't do tat_ on the current attribute.");
  return function tat_(input) { return this.ownerElement.toggleAttribute(name); };
}

function rat_Rule(name) {
  name = name.split("_")[1];
  return function rat_(input) { return this.ownerElement.removeAttribute(name); };
}

function clazz() { return this.ownerElement.getAttribute("class"); }

function classDot(name) {
  name = name.split(".")[1];
  return name ?
    function classDot() { return this.ownerElement.classList.contains(name); }:
    function classList() { return this.ownerElement.classList; } ;
}

function class_(rule) {
  const args = rule.split("_").slice(1);
  const [name, onOff] = args;
  if (onOff != "2" && onOff != "1" && onOff != "0")
    throw new SyntaxError("second parameter to 'class_' must be either 0, 1, or 2.");

  if (onOff == "2")       //:class_name_2 :class__2
    return name ?
      function class_name_2() { return this.ownerElement.classList.toggle(name); } :
      function class__2(input) { return this.ownerElement.classList.toggle(input); };

  if (onOff == "1")        //:class_name_1 :class__1
    return name ?
      function class_name_1() { return this.ownerElement.classList.add(name), name; } :
      function class__1(input) { return this.ownerElement.classList.add(input), input; };

  if (onOff == "0")        //:class_name_0 :class__0
    return name ?
      function class_name_0() { return this.ownerElement.classList.remove(name), name; } :
      function class__0(input) { return this.ownerElement.classList.remove(input), input; };

  if (name)                //:class_name
    return function class_name(i) { return this.ownerElement.classList.toggleClass(name, !!i), name; };

  let previous;            //:class_
  return function class_(input) {
    if (previous)
      this.ownerElement.classList.remove(previous);
    return this.ownerElement.classList.add(previous = input), input;
  }
}

// export function toggleClass_(name) {
//   const segs = name.split("_");
//   const name2 = segs[1];
//   let previous;
//   if (!name2) {
//     return function toggleClass_input(input) {
//       if (previous)
//         this.ownerElement.classList.remove(previous);
//       previous = input;
//       return this.ownerElement.classList.toggle(input), input;
//     }
//   }
//   if (segs.length === 3)
//     return function toggleClass_onOff(input) {
//       return this.ownerElement.classList.toggle(name2, !!input), !!input ? name2 : undefined;
//     }
//   return function toggleClass_name() {
//     return this.ownerElement.classList.toggle(name2), name2;
//   }
// }

// class_dragging? Every time you call it, it toggles on off
// class_dragging_1? this means classList.addClass(dragging). Less used. And here the second alternative is always true.
// class_dragging_? this means classList.toggleClass(dragging, !!input)
// class_ ? means toggle the incoming class. (if the same reaction is called again, it will remove what was added last, and then add new class.)
// class.something ? classList.hasClass()checks if there is a class there.
// class? gives the classlist as a string.
// class. gives the classlist object.

const PREFIX = "doubledots-250606-";
function broadcast_(rule) {
  const name = PREFIX + (rule.split("_")[1] || "");
  return function broadcast_name(input) {
    return (this.__broadcast ??= new BroadcastChannel(name)).postMessage(input), input;
  };
}

function Broadcast_(rule) {
  const name = PREFIX + (rule.split("_")[1] || "");

  return class Broadcast_name extends AttrCustom {
    upgrade() {
      this.__broadcast ??= new BroadcastChannel(name);
      this.__broadcast.addEventListener("message", this.__listener = this.onmessage.bind(this));
    }

    onmessage({ data }) {
      this.dispatchEvent(Object.assign(new Event("broadcast"), { [Event.data]: data }));
    }

    remove() {
      this.__broadcast.removeEventListener("message", this.__listener);
      this.__broadcast.close();
      super.remove();
    }
  }
}

function matchesPath(observedPaths, path) {
  for (let observedPath of observedPaths)
    if (path.startsWith(observedPath))
      return true;
}

function pathsAllSet(observedPaths, state) {
  for (let path of observedPaths) {
    let obj = state;
    for (let p of path) {
      if (!(p in obj))
        return false;
      obj = obj[p];
    }
  }
  return true;
}

function makeIterator(attrs, state, pathString) {
  if (!pathString)
    return attrs[Symbol.iterator]();
  const matches = [];
  for (let at of attrs) {
    if (!at.constructor.paths)
      matches.push(at);
    else if (matchesPath(at.constructor.branches, pathString))
      if (pathsAllSet(at.constructor.paths, state))
        matches.push(at);
  }
  return matches[Symbol.iterator]();
}

const attrs = {};
function addAttr(at, name) {
  (attrs[name] ??= new DoubleDots.AttrWeakSet()).add(at);
}
const states = {};

function setInObjectCreatePaths(obj, path, key, value) {
  for (let p of path)
    obj = (obj[p] ??= {});
  obj[key] = value;
}

function setInObjectIfDifferent(obj, path, key, value) {
  const parent = path.reduce((o, p) => o?.[p], obj);
  if (JSON.stringify(parent?.[key]) === JSON.stringify(value))
    return false;
  setInObjectCreatePaths(obj, path, key, value);
  return true;
}

class State extends AttrCustom {
  upgrade() { addAttr(this, this.trigger); }
}

function state(value) {
  const name = eventLoop.reaction;
  if (JSON.stringify(states[name]) === JSON.stringify(value))
    return;
  const e = new Event("state");
  e[Event.data] = states[name] = value;
  const it = makeIterator(attrs[name], states[name]);
  eventLoop.dispatchBatch(e, it);
}

function State_(rule) {
  const [name, ...branches] = rule.split("_");
  const paths = branches.map(b => b.split("."));
  return class State extends AttrCustom {
    upgrade() { addAttr(this, name); }
    static get branches() { return branches; }
    static get paths() { return paths; }
  };
}

function state_(rule) {
  let [name, branch] = rule.split("_");
  const path = branch.split(".");
  const key = path.pop();
  return function (value) {
    const change = setInObjectIfDifferent(states[name] ??= {}, path, key, value);
    if (!change)
      return;
    const e = new Event(name);
    e[Event.data] = states[name];
    const it = makeIterator(attrs[name], states[name], branch);
    eventLoop.dispatchBatch(e, it);
  };
}

const triggers = new DoubleDots.AttrWeakSet();
let active$1;

const LocationEvent = _ => Object.assign(new Event("location"), { [Event.data]: new URL(location) });
let specNav;
function external(url) {
  if (url.origin !== window.location.origin) return true;
  const [whitelist, ...blacklist] = specNav?.value?.split(";");// slightly inefficient
  if (whitelist && !url.pathname.startsWith(whitelist)) return true;
  return blacklist.filter(Boolean).some(p => url.pathname.startsWith(p));
}

class Nav extends AttrCustom {
  upgrade() {
    if (!this.reactions.length && this.value) //naive, no check of overlaps
      return specNav = this;
    if (!active$1) {
      for (let e of ["click", "popstate"])
        document.documentElement.setAttribute(`${e}:${this.trigger}`);
      active$1 = true;
    }
    triggers.add(this);
    this.dispatchEvent(LocationEvent());
  }
  remove() {
    triggers.delete(this);
  }
}

function nav(e) {
  if (typeof e === "string") {
    const url = new URL(e, location.href);
    if (external(url))
      return;
    history.pushState(null, null, url.href);
    return eventLoop.dispatchBatch(LocationEvent(), triggers);
  }
  if (!triggers.size) {
    for (let e of ["click", "popstate", "hashchange"])
      document.htmlElement.removeAttribute(`${e}:${eventLoop.reaction.name}`);
    //todo check that this eventLoop.reaction.name is correct
    active$1 = false;
    return;
  }
  if (e.defaultPrevented)
    return;
  if (e.type === "popstate") {
    e.preventDefault();
  } else if (e.type === "click") {
    const a = e.target.closest("a[href]");
    if (!a)
      return;
    const url = new URL(a.href, location.href);
    if (external(url))
      return;
    e.preventDefault();
    const target = a.getAttribute("target");
    if (target?.toLowerCase() === "_blank")// todo fix the logic here so all the target values are handled correctly.  && target !== "_self" && target !== "_top") //todo
      return window.open(url.href, target);
    history.pushState(null, null, url);
  }
  eventLoop.dispatchBatch(LocationEvent(), triggers);
}

class LoopCube {
  static compareSmall(compare, old, now) {
    const exact = new Array(now.length);
    const unused = [];
    if (!old?.length)
      return { exact, unused };
    main: for (let o = 0; o < old.length; o++) {
      for (let n = 0; n < now.length; n++) {
        if (!exact[n] && compare(old[o], now[n])) {
          exact[n] = o;
          continue main;
        }
      }
      unused.push(o);
    }
    return { exact, unused };
  }

  constructor(embrace, compare = (a, b) => a === b) {
    this.embrace = embrace;
    this.now = [];
    this.nowEmbraces = [];
    this.comparator = LoopCube.compareSmall.bind(null, compare);
  }

  step(now = []) {
    const old = this.now;
    const oldEmbraces = this.nowEmbraces;
    this.now = now;
    const { exact, unused } = this.comparator(old, now);
    const embraces = new Array(now.length);
    const changed = [];
    for (let n = 0; n < exact.length; n++) {
      const o = exact[n];
      if (o != null) {
        embraces[n] = oldEmbraces[o];
      } else {
        changed.push(n);
        embraces[n] = unused.length ? oldEmbraces[unused.shift()] : this.embrace.clone();
      }
    }
    this.nowEmbraces = embraces;
    const removes = unused.map(o => oldEmbraces[o]);
    return { embraces, removes, changed };
  }
}

const loophole = /\b(?:JSON.stringify|Object.values|Object.keys|Object.entries|(?:instanceof\s+(?:[\p{L}\p{N}_$]+)))\b/;
const ignore = /\b(?:break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|false|finally|for|function|if|implements|import|in|interface|let|new|null|package|private|protected|public|return|static|switch|throw|true|try|typeof|var|void|while|with|yield|async|await|\s+)\b/; //space are ignored
const dotWords = /\.\s*[\p{L}_$][\p{L}\p{N}_$]*(?:\s*\.\s*[\p{L}\p{N}_$]+)*/u;
const words = /#?[\p{L}_$][\p{L}\p{N}_$]*(?:\s*\.\s*[\p{L}\p{N}_$]+)*/u;
const quote1 = /'([^'\\]*(\\.[^'\\]*)*)'/;
const quote2 = /"([^"\\]*(\\.[^"\\]*)*)"/;
const number = /0[xX][0-9a-fA-F]+|\d*\.?\d+(?:[eE][+-]?\d+)?/;
const regex = /\/[^/\\]*(?:\\.[^/\\]*)*\/[gimyu]*/;
const linecomment = /\/\/[^\n]*/;
const starcomment = /\/\*[^]*?\*\//;

//todo so many security problems. Mainly with ["lookup"] and ("something"||[]).dot.lookups

//0. [].constructor. 
//02. []["constructor"] => That will give us the Array object without any dotWords. Only [] lookups.
//1. template strings: `comments ${here can come devils}`. strategy 1) make it throw an error, 2) tokenize ${} inside recursively?..
//2. something["bad"].CAN.HAPPEN.HERE.constructor.__proto__.etc strategy a) make it throw an error? b) make the function work hiddenly?
// const dangerous = /super|window|this|document|globalThis|arguments|Function|eval/;
// These dangerous words are captured, replaced with args[1], and attempted gotten from the context. Thus, they are safe.

const tokens = [loophole, ignore, words, dotWords, quote1, quote2, number, linecomment, starcomment, regex];
const tokenizer = new RegExp(tokens.map(r => `(${r.source})`).join("|"), "gu");

function extractArgs(txt) {
  return txt.replaceAll(tokenizer, (o, l, i, p) =>
    p ? `args("${p.replace(/\s+/g, "")}")` : o);
}

function interpretTemplateString(txt) {
  return `\`${txt.split(/{{([^}]+)}}/).map((str, i) =>
    i % 2 ?
      `\${(v = ${extractArgs(str)}) === false || v === undefined ? "": v}` :
      str.replaceAll("`", "\\`")).join("")}\``;
}

const tsts = [[
  `series instanceof Array`,
  `args("series") instanceof Array`
], [
  `//the word are all references. They will *all* be replaced with arg[i]
  const word = / #something.else */u;
  const quote = / name /;
  const number = /n . a . m . e/;
  const regex = /\/[^/\\]*(?:\\.[^/\\]*)*\/[gimyu]*/;
  const starcomment = /\/\*[^]*?\*\//;`,

  `//the word are all references. They will *all* be replaced with arg[i]
  const args("word") = / #something.else */u;
  const args("quote") = / name /;
  const args("number") = /n . a . m . e/;
  const args("regex") = //[^/\\]*(?:\\.[^/\\]*)*/[gimyu]*/;
  const args("starcomment") = //*[^]*?*//;`
], [
  `name hello . sunshine #hello.world bob123 _123`,
  `args("name") args("hello.sunshine") args("#hello.world") args("bob123") args("_123")`
], [
  `name.hello["bob"].sunshine  . bob`,
  `args("name.hello")["bob"].sunshine  . bob`
],
  //todo this last test.. it should actually turn this into args("name.hello.bob.sunshine.bob"), right? We should disallow property names with space in them? " "

];

function test() {
  for (let [before, after] of tsts) {
    const exp = extractArgs(before).trim();
    if (exp !== after)
      console.log(exp);
  }
}

// test();

//Template engine
function dotScope(data, superior, cache = {}) {
  const me = function scope(path) {
    return path.constructor === Object ? dotScope(data, me, path) :
      path === "$" ? data : cache[path] ??=
        path.split('.').reduce((o, p) => o?.[p], cache) ??
        superior?.(path) ??
        path.split('.').reduce((o, p) => o?.[p], data);
  };
  return me;
}

class EmbraceRoot {
  constructor(name, docFrag, nodes, expressions) {
    this.name = name;
    this.template = docFrag;
    this.nodes = nodes;
    this.topNodes = [...docFrag.childNodes];
    this.expressions = expressions;
    this.todos = [];
    for (let i = 0; i < expressions.length; i++)
      if (expressions[i])
        this.todos.push({ exp: expressions[i], node: nodes[i] });
  }

  clone() {
    const docFrag = this.template.cloneNode(true);
    const nodes = [...flatDomNodesAll(docFrag)];
    return new EmbraceRoot(this.name, docFrag, nodes, this.expressions);
  }

  run(scope, _, ancestor) {
    for (let { exp, node } of this.todos)
      if (ancestor.contains(node.ownerElement ?? node))
        exp.run(scope, node, ancestor);
  }

  prep(funcs) {
    for (let { exp } of this.todos) {
      exp.cb = funcs[exp.name];
      exp.innerRoot?.prep(funcs);
    }
  }

  runFirst(el, dataObject, funcs) {
    this.prep(funcs);
    el.prepend(...this.topNodes);
    this.run(dotScope(dataObject), 0, el);
  }
}

class EmbraceTextNode {
  constructor(name, exp) {
    this.name = name;
    this.exp = exp;
  }

  run(scope, node) {
    node.textContent = this.cb(scope);
  }
}

class EmbraceCommentFor {
  constructor(name, innerRoot, varName, exp) {
    this.name = name;
    this.innerRoot = innerRoot;
    this.varName = varName;
    this.exp = exp;
    this.cb;
    this.iName = `#${varName}`;
    this.dName = `$${varName}`;
  }

  run(scope, node, ancestor) {
    let list = this.cb(scope) ?? [];
    const inMode = !(Symbol.iterator in list);
    const cube = node.__cube ??=
      new LoopCube(this.innerRoot, inMode ? (a, b) => JSON.stringify(a) === JSON.stringify(b) : undefined);
    const now = inMode ? Object.entries(list) : list;
    const { embraces, removes, changed } = cube.step(now);
    for (let em of removes)
      for (let n of em.topNodes)
        n.remove();
    for (let em of embraces)
      node.before(...em.topNodes);
    for (let i of changed) {
      const subScope = { [this.iName]: i };
      if (inMode) {
        subScope[this.varName] = now[i][1];
        subScope[this.dName] = now[i][0];
      } else {
        subScope[this.varName] = now[i];
      }
      embraces[i].run(scope(subScope), undefined, ancestor);
    }
  }
}

class EmbraceCommentIf {
  constructor(name, emRoot, exp) {
    this.name = name;
    this.innerRoot = emRoot;
    this.exp = exp;
  }

  run(argsDict, node, ancestor) {
    const em = node.__ifEmbrace ??= this.innerRoot.clone();
    const test = !!this.cb(argsDict);
    //we are adding state to the em object. instead of the node.
    if (test && !em.state)
      node.before(...em.topNodes);
    else if (!test && em.state)
      node.append(...em.topNodes);
    if (test)
      em.run(argsDict({}), undefined, ancestor);
    em.state = test;
  }
}

//PARSER
function* flatDomNodesAll(docFrag) {
  const it = document.createNodeIterator(docFrag, NodeFilter.SHOW_ALL);
  for (let n = it.nextNode(); n = it.nextNode();) {
    yield n;
    if (n instanceof Element) yield* n.attributes;
  }
}

function parseTemplate(template, name = "embrace") {
  const nodes = [...flatDomNodesAll(template.content)];
  const expressions = nodes.map((n, i) => parseNode(n, name + "_" + i));
  return new EmbraceRoot(name, template.content, nodes, expressions);
}

function parseNode(n, name) {
  if (n instanceof Text || n instanceof Attr || n instanceof Comment) {
    if (n.textContent.match(/{{([^}]+)}}/))
      return new EmbraceTextNode(name, n.textContent);
  } else if (n instanceof HTMLTemplateElement) {
    const emTempl = parseTemplate(n, name);
    let res;
    if (res = n.getAttribute("for")) {
      const ctrlFor = res.match(/^\s*([^\s]+)\s+(?:of)\s+(.+)\s*$/);
      if (!ctrlFor)
        throw new SyntaxError("embrace for error: " + res);
      const [, varName, exp] = ctrlFor;
      return new EmbraceCommentFor(name, emTempl, varName, exp);
    }
    if (res = n.getAttribute("if"))
      return new EmbraceCommentIf(name, emTempl, res);
    return emTempl;
  }
}

function extractFuncs(root, res = {}) {
  for (let { exp } of root.todos) {
    const code =
      exp instanceof EmbraceTextNode ? interpretTemplateString(exp.exp) :
        exp instanceof EmbraceCommentFor ? extractArgs(exp.exp) :
          exp instanceof EmbraceCommentIf ? extractArgs(exp.exp) :
            undefined;
    res[exp.name] = `(args, v) => ${code}`;
    if (exp.innerRoot)
      extractFuncs(exp.innerRoot, res);
  }
  return res;
}

//TUTORIAL

function hashDebug(script, id) {
  return `Add the following script in the <head> element:

<script embrace="${id}">
  (window.Embrace ??= {})["${id}"] = ${script};
</script>`;
}

// :embrace
function embrace(dataObject) {
  let em = this.ownerElement.__embrace;
  if (em)
    return em.run(dotScope(dataObject), 0, this.ownerElement);
  const id = this.ownerElement.id || "embrace";
  const templ = this.ownerElement.firstElementChild;
  if (!(templ instanceof HTMLTemplateElement))
    throw new Error("This first element child of :embrace ownerElement must be a template");
  em = this.ownerElement.__embrace = parseTemplate(templ, id);
  if (window.Embrace?.[id])
    return em.runFirst(this.ownerElement, dataObject, window.Embrace[id]);
  const funcs = extractFuncs(em);
  const script = "{\n" + Object.entries(funcs).map(([k, v]) => `${k}: ${v}`).join(',\n') + "\n}";
  DoubleDots.importBasedEval(script).then(funcs => {
    DoubleDots.log?.(":embrace production", hashDebug(script, id));
    (window.Embrace ??= {})[id] = funcs;
    em.runFirst(this.ownerElement, dataObject, funcs);
  });
}

const scopes = {
  ".": "this.",
  "e.": "window.eventLoop.event.",
  "t.": "window.eventLoop.event.target.",
  "w.": "window.",
  "d.": "window.document.",

  "i.": "args[0].",
  "i0.": "args[0].",
  "i1.": "args[1].",
  "i2.": "args[2].",
  "i3.": "args[3].",
  "i4.": "args[4].",
  "i5.": "args[5].",
  "i6.": "args[6].",
  "i7.": "args[7].",
  "i8.": "args[8].",
  "i9.": "args[9].",
  "i10.": "args[10].",
  "i11.": "args[11].",
  "i12.": "args[12].",
  "i13.": "args[13].",
  "i14.": "args[14].",
  "i15.": "args[15].",
  "args": "args",

  "oi.": "args[0].",
  "at.": "window.eventLoop.attribute.", //useful when dash rules have moved the origin. dash rules break lob.. used in gestures?
  "el.": "window.eventLoop.attribute.ownerElement.", //todo same as this.ownerElement??
  "this.": "this.",
  "window.": "window.",
  "document.": "document."
};

//todo must rename oi to i, because of the change of structures.
function processRef(prop) {
  for (let prefix in scopes)
    if (prop.startsWith(prefix))
      return DoubleDots.kebabToPascal(scopes[prefix] + prop.slice(prefix.length));
}

const primitives =
  /^((-?\d+(\.\d+)?([eE][-+]?\d+)?)|this|window|document|i|e|true|false|undefined|null)$/;

function textToExp(txt) {
  let [prop, ...args] = txt.split("_");
  const ref = processRef(prop).replaceAll(".", "?.");
  args = args.map(arg => processRef(arg) || primitives.test(arg) ? arg : `"${arg}"`);
  const sargs = args.join(", ");
  const setter = !args.length ? "" : args.length === 1 ? `=${sargs}` : `=[${sargs}]`;
  return `(${ref} instanceof Function ? ${ref}(${sargs}) : (${ref}${setter}))`;
}

function DotReactionRule(fullname) {
  const exp = textToExp(fullname);
  const code = `function dotReaction(...args) { return ${exp}; }`;
  return DoubleDots.importBasedEval(code);
}

//basic filters
function BreakOnFalseReactionRule(fullname) {
  const exp = textToExp(fullname.slice(2));
  const code = `function dotReaction(oi) { return ${exp} || EventLoop.break; }`;
  return DoubleDots.importBasedEval(code);
}

function BreakOnTrueReactionRule(fullname) {
  const exp = textToExp(fullname.slice(2));
  const code = `function dotReaction(oi) { return ${exp} && EventLoop.break; }`;
  return DoubleDots.importBasedEval(code);
}

const dynamicDots = {};
for (let prefix in scopes)
  dynamicDots[prefix] = DotReactionRule;
dynamicDots["x."] = BreakOnFalseReactionRule;
dynamicDots["y."] = BreakOnTrueReactionRule;

class ER {
  constructor(posts) {
    this.posts = posts;
  }

  * parents(ref, type, prop) {
    for (let [k, v] of Object.entries(this.posts))
      if (!type || k.startsWith(type))
        if (prop && Array.isArray(v[prop]) && v[prop].includes(ref))
          yield k;
  }

  parent(ref, type, prop) {
    return this.parents(ref, type, prop).next().value;
  }

  //todo this can loop forever, when we have a person with a friend 
  //     that has a friend that is the first person. This won't work.
  //
  //todo 1. we need to go width first.
  //todo 2. we need to check the path. If we are going from:
  //        person / [friends] / person / [friends]
  //        then we need to stop at the 2nd [friends].
  //        we should only resolve person[friends] relationship *once*.
  //        when we meet person[friends] 2nd time, we should just skip it.
  //        this means that when we meet "person" the second time, 
  //        we should skip all the arrays.
  resolve(key, vars) {
    const res = Object.assign({}, vars, this.posts[key]);
    for (let p in res)
      if (res[p] instanceof Array)
        res[p] = res[p].map(k => this.resolve(k, vars));
    return res;
  }
}

class ErAnalysis extends ER {

  //step 1
  static entitiesToTypeValue(posts) {
    const res = {};
    for (let id in posts) {
      const post = posts[id];
      const type = post.type;
      const entityType = res[type] ??= {};
      for (let prop in post) {
        const values = entityType[prop] ??= [];
        values.push(post[prop]);
      }
    }
    return res;
  }

  //step 2
  static extractTypeList(list) {
    const types = [...new Set(list.map(ErAnalysis.extractType))].sort();
    if (types.includes("text") && types.includes("textmd"))
      types.splice(types.indexOf("text"), 1);
    if (types.includes("int") && types.includes("float"))
      types.splice(types.indexOf("int"), 1);
    if (types[0].startsWith("list: ")) {
      let refs = types.map(t => t.slice(6).split(","));
      return [...new Set(refs.flat().filter(Boolean))];
    }
    if (types.length === 1)
      return types[0];
    debugger;
    throw new Error("should be fixed..");
  }

  static isMarkDown(value) {
    if (!(/[#*_~`]/.test(value)))
      return;
    const markdownPatterns = [
      /\*\*.*?\*\*/,         // bold (**text**)
      /\*.*?\*/,             // italics (*text*)
      /~~.*?~~/,             // strikethrough (~~text~~)
      /`.*?`/,               // inline code (`code`)
      /#+\s+.+/,             // headings (# heading, ## subheading, etc.)
      /\[.*?\]\(.*?\)/,      // links ([text](url))
      /!\[.*?\]\(.*?\)/,     // images (![alt](url))
      /^>\s+.+/m             // blockquotes (> quote)
    ];
    for (const pattern of markdownPatterns)
      if (pattern.test(value))
        return "textmd";
  }

  static extractType(value) {
    if (Array.isArray(value))
      return "list: " + [...new Set(value.map(str => str.split("/")[0]))].join(",");
    // if (typeof value === 'string' && !isNaN(Date.parse(value)))
    //   return "date";
    try {
      // only absolute urls
      // not relative urls. so "./hello.png" is not a url... todo
      if (decodeURI(new URL(value).href) === decodeURI(value)) return "url";
    } catch (_) { }
    if ((/^#([0-9A-F]{3}){1,2}$/i).test(value))
      return "color";
    if (Number(value) + "" === value)
      return "number";
    return ErAnalysis.isMarkDown(value) ?? "text";
  }

  static valuesToTypes(typeValueSchema) {
    const res = {};
    for (let type in typeValueSchema) {
      const entityType = res[type] = {};
      const propValues = typeValueSchema[type];
      for (let prop in propValues)
        entityType[prop] = ErAnalysis.extractTypeList(propValues[prop]);
    }
    return res;
  }

  //step 3 relations
  static topologicalSort(schemas, cp) {
    const sortedSchemas = [];
    const visited = new Set();
    const tempMarked = new Set();

    function visit(schema) {
      if (tempMarked.has(schema))
        throw new Error("Cycle detected, schema relationships form a loop.");
      if (!visited.has(schema)) {
        tempMarked.add(schema);
        const referencedSchemas = cp[schema] || new Set();
        for (const referred of referencedSchemas)
          visit(referred);
        tempMarked.delete(schema);
        visited.add(schema);
        sortedSchemas.push(schema);
      }
    }
    for (const schema in schemas)
      visit(schema);
    return sortedSchemas;
  }

  static bottomUpRelations(schemaType) {
    const res = {};
    for (let type in schemaType)
      for (let prop in schemaType[type])
        if (schemaType[type][prop] instanceof Array)
          for (let referred of schemaType[type][prop])
            (res[referred] ??= new Set()).add(type);
    return res;
  }

  static analyze(posts) {
    const schemaTypeValues = ErAnalysis.entitiesToTypeValue(posts);
    const schemaTypedUnsorted = ErAnalysis.valuesToTypes(schemaTypeValues);
    const relationsUp = ErAnalysis.bottomUpRelations(schemaTypedUnsorted);
    const entitySequence = ErAnalysis.topologicalSort(schemaTypedUnsorted, relationsUp);
    return entitySequence.map(type => [type, schemaTypedUnsorted[type]]);
  }

  #schema;
  #schemaSorted;
  get schema() {
    return this.#schema ??= Object.fromEntries(this.schemaSorted);
  }
  get schemaSorted() {
    return this.#schemaSorted ??= ErAnalysis.analyze(this.posts);
  }
}

const RESPONSE_TYPES = {
  json: "json",
  text: "text",
  blob: "blob",
  form: "formData",
  formdata: "formData",
  bytes: "bytes",
  uint8array: "bytes",
  uint8: "bytes",
  clone: "clone",
  arraybuffer: "arrayBuffer",
  buffer: "arrayBuffer",
};
async function safeJsonResponse(res) {
  const text = await res.text();
  return text ? JSON.parse(text) : undefined;
}
function parseResponseType(tail = "json") {
  if (!(tail in RESPONSE_TYPES))
    throw new SyntaxError("Unknown fetch- response type: " + tail);
  tail = RESPONSE_TYPES[tail];
  return tail === "json" ?
    safeJsonResponse :
    function response(resp) { return resp[tail](); }
}

const METHOD = {
  post: 'POST',
  put: 'PUT',
  delete: 'DELETE',
  patch: 'PATCH',
};
const dotMETHOD = {
  get: 'GET',
  head: 'HEAD',
};
const HEADERS = {
  auth: ["credentials", 'include'],
  omit: ["credentials", 'omit'],

  nocache: ["cache", 'no-cache'],
  nostore: ["cache", 'no-store'],
  reload: ["cache", 'reload'],
  forcecache: ["cache", 'force-cache'],
  onlyifcached: ["cache", 'only-if-cached'],

  cors: ["mode", 'cors'],
  nocors: ["mode", 'no-cors'],
  sameorigin: ["mode", 'same-origin'],

  noreferrer: ["referrerPolicy", 'no-referrer'],
  origin: ["referrerPolicy", 'origin'],
  originwhencross: ["referrerPolicy", 'origin-when-cross-origin'],
  strictorigin: ["referrerPolicy", 'strict-origin'],
  strictorigincross: ["referrerPolicy", 'strict-origin-when-cross-origin'],
  unsafe: ["referrerPolicy", 'unsafe-url'],
  refsameorigin: ["referrerPolicy", 'same-origin'],
};
function parseSegments(name, splitter, methodMap) {
  const [, ...segments] = name.toLowerCase().split(splitter);
  let method;
  let responseType;
  const headers = {};
  for (let seg of segments) {
    if (methodMap[seg]) {
      if (method)
        throw new SyntaxError("multiple fetch methods: " + methodMap[seg] + ", " + seg);
      method = methodMap[seg];
    } else if (HEADERS[seg]) {
      const [type, value] = HEADERS[seg];
      if (type in headers)
        throw new SyntaxError("multiple fetch headers of same type: " + type + ", " + seg);
      headers[type] = value;
    } else {
      throw new SyntaxError("unknown fetch segment: " + seg);
    }
  }
  return { method, responseType, headers };
}

//Att! :fetch* defaults to .json()
async function basicFetch() {
  return await safeJsonResponse(await fetch(this.value));
}

function fetchDashRule(name) {
  const [head, type, tail] = name.split(/([._])/);
  const responder = parseResponseType(tail);
  const m = type === "." ? "GET" : "POST";
  const { headers, method = m } = parseSegments(head, "-", type === "." ? dotMETHOD : METHOD);
  return type === "." ?
    async function fetchDash() {
      return responder(await fetch(this.value, { method, headers }));
    } :
    async function fetchDash_(body) {
      return responder(await fetch(this.value, { method, headers, body }));
    };
}

//fetch.
function fetchDotRule(name) {
  const [, tail] = name.split(".");
  const responder = parseResponseType(tail);
  return async function fetchDash() {
    return responder((await fetch(this.value, { method: "GET" })));
  }
}

//fetch_
function fetch_Rule(name) {
  const [, tail] = name.split("_");
  const responder = parseResponseType(tail);
  return async function fetch_(body) {
    return await responder(await fetch(this.value, { method: "POST", body }));
  };
}

const stopPropOG = DoubleDots.nativeMethods("Event.prototype.stopImmediatePropagation");
const addEventListenerOG = DoubleDots.nativeMethods("EventTarget.prototype.addEventListener");
const removeEventListenerOG = DoubleDots.nativeMethods("EventTarget.prototype.removeEventListener");

function* bubble(e) {
  const path = e.composedPath();
  for (let i = path.indexOf(e.currentTarget); i < path.length; i++)
    if (path[i].attributes)
      for (let at of path[i].attributes)
        if (at.trigger === e.type)
          yield at;
  for (let at of GLOBALS[e.type] ?? [])
    yield at;
}

function* nonBubble(e) {
  const path = e.composedPath();
  let i = e.currentTarget == window ? 0 : path.indexOf(e.currentTarget);
  for (; i < path.length; i++)
    if (path[i].attributes)
      for (let at of path[i].attributes)
        if (at.trigger === e.type)
          yield at;
  for (let at of GLOBALS[e.type] ?? [])
    yield at;
}

function propagateGlobal(e) { stopPropOG.call(e); eventLoop.dispatchBatch(e, GLOBALS[e.type]); }
function propagateGlobalBubbleNo(e) { stopPropOG.call(e); eventLoop.dispatchBatch(e, nonBubble(e)); }
function propagate(e) { stopPropOG.call(e); eventLoop.dispatchBatch(e, bubble(e)); }

const GLOBALS = {};
function addFrosenProp(thiz, name, value) {
  Object.defineProperty(thiz, name, { value, writable: false, configurable: false, enumerable: true });
}

class AttrEventBubble extends AttrCustom {
  upgrade() {
    addFrosenProp(this, "_type", this.trigger.replace(/_/g, ""));
    addFrosenProp(this, "_listener", propagate.bind(this));
    addEventListenerOG.call(this.ownerElement, this._type, this._listener);
  }
  remove() { removeEventListenerOG.call(this.ownerElement, this._type, this._listener); }
}

class AttrEventWindowBubbleNo extends AttrCustom {
  upgrade() {
    addFrosenProp(this, "_type", this.trigger.replace(/_/g, ""));
    addFrosenProp(this, "_listener", propagateGlobalBubbleNo.bind(this));
    (GLOBALS[this._type] ??= new Set()).add(this);
    addEventListenerOG.call(document, this._type, this._listener);
  }
  remove() {
    GLOBALS[this._type]?.delete(this);
    removeEventListenerOG.call(document, this._type, this._listener);
  }
}

class AttrEventWindow extends AttrCustom {
  upgrade() {
    addFrosenProp(this, "_type", this.trigger.replace(/_/g, ""));
    addFrosenProp(this, "_listener", propagateGlobal.bind(this));
    (GLOBALS[this._type] ??= new Set()).add(this);
    addEventListenerOG.call(window, this._type, this._listener);
  }
  remove() {
    GLOBALS[this._type]?.delete(this);
    removeEventListenerOG.call(window, this._type, this._listener);
  }
}

class AttrEventDocument extends AttrCustom {
  get #type() { return this.trigger.replace(/_/g, ""); }
  upgrade() {
    addFrosenProp(this, "_type", this.trigger.replace(/_/g, ""));
    addFrosenProp(this, "_listener", propagateGlobal.bind(this));
    (GLOBALS[this.#type] ??= new Set()).add(this);
    addEventListenerOG.call(document, this._type, this._listener);
  }
  remove() {
    GLOBALS[this.#type]?.delete(this);
    removeEventListenerOG.call(document, this._type, this._listener);
  }
}

class AttrEventDCL extends AttrCustom {
  upgrade() {
    addFrosenProp(this, "_listener", propagateGlobal.bind(this));
    (GLOBALS.domcontentloaded ??= new Set()).add(this);
    addEventListenerOG.call(document, "DOMContentLoaded", this._listener);
  }
  remove() {
    GLOBALS.domcontentloaded?.delete(this);
    removeEventListenerOG.call(document, "DOMContentLoaded", this._listener);
  }
}

function formdata_(rule) {
  const [, type] = rule.split("_");
  if (type === "json")
    return function formdata_json(form) {
      const obj = Object.create(null);
      for (const [key, value] of new FormData(form))
        !(key in obj) ? obj[key] = value :
          Array.isArray(obj[key]) ? obj[key].push(value) :
            obj[key] = [obj[key], value];
      return obj;
    };
  if (type === "urlencoded")
    return form => new URLSearchParams(new FormData(form));
  if(type === "multipart")
    return form => new FormData(form);
  if(type === "blob")
    return form => new Blob([new URLSearchParams(new FormData(form))], { type: "application/x-www-form-urlencoded" });
  throw new SyntaxError(`Invalid formdata type: ${type}. Must be "json" or "urlencoded".`);
}

let sheetWrapper;
function makeSheetWrapper() {
  let style = document.querySelector("style[csss]");
  if (!style) {
    style = document.createElement("style");
    style.setAttribute("csss", "");
    document.head.appendChild(style);
  }
  return sheetWrapper = new SheetWrapper(style.sheet);
}

let active;
function updateTextContent() {
  active ||= setTimeout(() => (sheetWrapper.cleanup(), (active = undefined)), 500);
}

class Class extends AttrCustom {

  upgrade() {
    this.__previousClasses = {};
  }

  set value(v) {
    super.value = v;
    sheetWrapper ??= makeSheetWrapper();
    let positions = [], last = -1;
    for (let clz of this.ownerElement.classList) {
      if (clz.includes("$")) {
        const ruleAndPos = sheetWrapper.addRule(clz, this.ownerElement);
        // const { pos, rule } = ruleAndPos;
        // positions[pos] = ruleAndPos;
        // if (pos < last) {
        //   const potentialErrors = positions.filter((_, i) => i > pos);
        //   for (let potential of potentialErrors) {
        //     const doubleKey = overlap(ruleAndPos, potential);
        //     if (doubleKey)
        //       console.warn(`Wrong sequence!! ${clz} should be positioned before ${potential}.`);
        //   }
        // } else
        //   last = pos;
      }
      updateTextContent();
    }
  }

  get value() { return super.value; }
}

export { AttrEventBubble as Abort, AttrEventWindowBubbleNo as Abort_, AttrEventWindow as Afterprint, AttrEventBubble as Animationend, AttrEventWindow as Animationend_, AttrEventBubble as Animationiteration, AttrEventWindow as Animationiteration_, AttrEventBubble as Animationstart, AttrEventWindow as Animationstart_, AttrEventWindow as Appinstalled, AttrEventBubble as Auxclick, AttrEventWindow as Auxclick_, AttrEventBubble as Beforecopy, AttrEventWindow as Beforecopy_, AttrEventBubble as Beforecut, AttrEventWindow as Beforecut_, AttrEventBubble as Beforeinput, AttrEventWindow as Beforeinput_, AttrEventWindow as Beforeinstallprompt, AttrEventBubble as Beforematch, AttrEventWindow as Beforematch_, AttrEventBubble as Beforepaste, AttrEventWindow as Beforepaste_, AttrEventWindow as Beforeprint, AttrEventBubble as Beforetoggle, AttrEventWindow as Beforetoggle_, AttrEventWindow as Beforeunload, AttrEventBubble as Beforexrselect, AttrEventWindow as Beforexrselect_, AttrEventBubble as Blur, AttrEventWindowBubbleNo as Blur_, Broadcast_, AttrEventBubble as Cancel, AttrEventWindow as Cancel_, AttrEventBubble as Canplay, AttrEventWindow as Canplay_, AttrEventBubble as Canplaythrough, AttrEventWindow as Canplaythrough_, AttrEventBubble as Change, AttrEventWindow as Change_, Class, AttrEventBubble as Click, AttrEventWindow as Click_, AttrEventBubble as Close, AttrEventWindow as Close_, AttrEventBubble as Command, AttrEventWindow as Command_, AttrEventBubble as Contentvisibilityautostatechange, AttrEventWindow as Contentvisibilityautostatechange_, AttrEventBubble as Contextlost, AttrEventWindow as Contextlost_, AttrEventBubble as Contextmenu, AttrEventWindow as Contextmenu_, AttrEventBubble as Contextrestored, AttrEventWindow as Contextrestored_, AttrEventBubble as Copy, AttrEventWindow as Copy_, AttrEventBubble as Cuechange, AttrEventWindow as Cuechange_, AttrEventBubble as Cut, AttrEventWindow as Cut_, AttrEventBubble as Dblclick, AttrEventWindow as Dblclick_, AttrEventWindow as Devicemotion, AttrEventWindow as Deviceorientation, AttrEventWindow as Deviceorientationabsolute, AttrEventDCL as Domcontentloaded, AttrEventBubble as Drag, AttrEventWindow as Drag_, AttrEventBubble as Dragend, AttrEventWindow as Dragend_, AttrEventBubble as Dragenter, AttrEventWindow as Dragenter_, AttrEventBubble as Dragleave, AttrEventWindow as Dragleave_, AttrEventBubble as Dragover, AttrEventWindow as Dragover_, AttrEventBubble as Dragstart, AttrEventWindow as Dragstart_, AttrEventBubble as Drop, AttrEventWindow as Drop_, AttrEventBubble as Durationchange, AttrEventWindow as Durationchange_, ER, AttrEventBubble as Emptied, AttrEventWindowBubbleNo as Emptied_, AttrEventBubble as Ended, AttrEventWindowBubbleNo as Ended_, ErAnalysis, AttrEventBubble as Error, AttrEventWindowBubbleNo as Error_, AttrEventBubble as Focus, AttrEventWindowBubbleNo as Focus_, AttrEventBubble as Formdata, AttrEventWindow as Formdata_, AttrEventDocument as Freeze, AttrEventBubble as Fullscreenchange, AttrEventWindow as Fullscreenchange_, AttrEventBubble as Fullscreenerror, AttrEventWindow as Fullscreenerror_, AttrEventBubble as Gotpointercapture, AttrEventWindow as Gotpointercapture_, AttrEventWindow as Hashchange, AttrEventBubble as Input, AttrEventWindow as Input_, AttrEventBubble as Invalid, AttrEventWindow as Invalid_, AttrEventBubble as Keydown, AttrEventWindow as Keydown_, AttrEventBubble as Keypress, AttrEventWindow as Keypress_, AttrEventBubble as Keyup, AttrEventWindow as Keyup_, AttrEventWindow as Languagechange, AttrEventBubble as Load, AttrEventWindowBubbleNo as Load_, AttrEventBubble as Loadeddata, AttrEventWindow as Loadeddata_, AttrEventBubble as Loadedmetadata, AttrEventWindow as Loadedmetadata_, AttrEventBubble as Loadstart, AttrEventWindow as Loadstart_, AttrEventBubble as Lostpointercapture, AttrEventWindow as Lostpointercapture_, AttrEventWindow as Message, AttrEventWindow as Messageerror, AttrEventBubble as Mousedown, AttrEventWindow as Mousedown_, AttrEventBubble as Mouseenter, AttrEventWindowBubbleNo as Mouseenter_, AttrEventBubble as Mouseleave, AttrEventWindowBubbleNo as Mouseleave_, AttrEventBubble as Mousemove, AttrEventWindow as Mousemove_, AttrEventBubble as Mouseout, AttrEventWindow as Mouseout_, AttrEventBubble as Mouseover, AttrEventWindow as Mouseover_, AttrEventBubble as Mouseup, AttrEventWindow as Mouseup_, AttrEventBubble as Mousewheel, AttrEventWindow as Mousewheel_, Nav, AttrEventWindow as Offline, AttrEventWindow as Online, AttrEventWindow as Pagehide, AttrEventWindow as Pagereveal, AttrEventWindow as Pageshow, AttrEventWindow as Pageswap, AttrEventBubble as Paste, AttrEventWindow as Paste_, AttrEventBubble as Pause, AttrEventWindowBubbleNo as Pause_, AttrEventBubble as Play, AttrEventWindowBubbleNo as Play_, AttrEventBubble as Playing, AttrEventWindowBubbleNo as Playing_, AttrEventBubble as Pointercancel, AttrEventWindow as Pointercancel_, AttrEventBubble as Pointerdown, AttrEventWindow as Pointerdown_, AttrEventBubble as Pointerenter, AttrEventWindowBubbleNo as Pointerenter_, AttrEventBubble as Pointerleave, AttrEventWindowBubbleNo as Pointerleave_, AttrEventDocument as Pointerlockchange, AttrEventDocument as Pointerlockerror, AttrEventBubble as Pointermove, AttrEventWindow as Pointermove_, AttrEventBubble as Pointerout, AttrEventWindow as Pointerout_, AttrEventBubble as Pointerover, AttrEventWindow as Pointerover_, AttrEventBubble as Pointerrawupdate, AttrEventWindow as Pointerrawupdate_, AttrEventBubble as Pointerup, AttrEventWindow as Pointerup_, AttrEventWindow as Popstate, AttrEventDocument as Prerenderingchange, AttrEventBubble as Progress, AttrEventWindow as Progress_, AttrEventBubble as Ratechange, AttrEventWindow as Ratechange_, AttrEventDocument as Readystatechange, AttrEventWindow as Rejectionhandled, AttrEventBubble as Reset, AttrEventWindow as Reset_, AttrEventBubble as Resize, AttrEventWindow as Resize_, AttrEventDocument as Resume, AttrEventBubble as Scroll, AttrEventWindow as Scroll_, AttrEventBubble as Scrollend, AttrEventWindow as Scrollend_, AttrEventBubble as Scrollsnapchange, AttrEventWindow as Scrollsnapchange_, AttrEventBubble as Scrollsnapchanging, AttrEventWindow as Scrollsnapchanging_, AttrEventBubble as Search, AttrEventWindow as Search_, AttrEventBubble as Securitypolicyviolation, AttrEventWindow as Securitypolicyviolation_, AttrEventBubble as Seeked, AttrEventWindow as Seeked_, AttrEventBubble as Seeking, AttrEventWindow as Seeking_, AttrEventBubble as Select, AttrEventWindow as Select_, AttrEventBubble as Selectionchange, AttrEventWindow as Selectionchange_, AttrEventBubble as Selectstart, AttrEventWindow as Selectstart_, AttrEventBubble as Slotchange, AttrEventWindow as Slotchange_, AttrEventBubble as Stalled, AttrEventWindowBubbleNo as Stalled_, State, State_, AttrEventWindow as Storage, AttrEventBubble as Submit, AttrEventWindow as Submit_, AttrEventBubble as Suspend, AttrEventWindowBubbleNo as Suspend_, AttrEventBubble as Timeupdate, AttrEventWindow as Timeupdate_, AttrEventBubble as Toggle, AttrEventWindow as Toggle_, AttrEventBubble as Touchcancel, AttrEventWindow as Touchcancel_, AttrEventBubble as Touchend, AttrEventWindow as Touchend_, AttrEventBubble as Touchmove, AttrEventWindow as Touchmove_, AttrEventBubble as Touchstart, AttrEventWindow as Touchstart_, AttrEventBubble as Transitioncancel, AttrEventWindow as Transitioncancel_, AttrEventBubble as Transitionend, AttrEventWindow as Transitionend_, AttrEventBubble as Transitionrun, AttrEventWindow as Transitionrun_, AttrEventBubble as Transitionstart, AttrEventWindow as Transitionstart_, AttrEventWindow as Unhandledrejection, AttrEventWindow as Unload, AttrEventDocument as Visibilitychange, AttrEventBubble as Volumechange, AttrEventWindow as Volumechange_, AttrEventBubble as Waiting, AttrEventWindow as Waiting_, AttrEventBubble as Webkitanimationend, AttrEventWindow as Webkitanimationend_, AttrEventBubble as Webkitanimationiteration, AttrEventWindow as Webkitanimationiteration_, AttrEventBubble as Webkitanimationstart, AttrEventWindow as Webkitanimationstart_, AttrEventBubble as Webkitfullscreenchange, AttrEventWindow as Webkitfullscreenchange_, AttrEventBubble as Webkitfullscreenerror, AttrEventWindow as Webkitfullscreenerror_, AttrEventBubble as Webkittransitionend, AttrEventWindow as Webkittransitionend_, AttrEventBubble as Wheel, AttrEventWindow as Wheel_, broadcast_, classDot, class_, clazz, dynamicDots as dynamicsDots, eDot, e_, embrace, basicFetch as fetch, fetchDashRule as "fetch-", fetchDotRule as "fetch.", fetch_Rule as fetch_, formdata_, gatRule as "gat.", nav, rat_Rule as rat_, sat_Rule as sat_, state, state_, tat_Rule as tat_ };
//# sourceMappingURL=ddx.js.map
