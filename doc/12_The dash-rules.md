# The `-dash` rule

> Hey jQuery! Long time no hear:) Me? I'm doing good, thanks for asking :) But sorry for coming at you out the blue like this. I know it was a long time ago. And we didn't really have a clean break. I just started looking at some other frameworks, and then one thing led to another.. it just happened.. But I wanted to tell you that.. I see now that I was wrong. That you were right. And that we were good together, just like you said. I wish I hadn't left you the way I did. I see that now. I am truly sorry about that. But. What I waaant to say is.. I just really wanted to thank you for a really good time back then. I really enjoyed myself when I was with you. It was real. I meant all the things I wrote. I just wanted you to know that.. Anyways, I just want to say thank you, jQuery. For everything.

The purpose of the dash reaction is to move the origin of the reaction chain to a new HTML node (elements or attributes). The dash rule is like a special DoubleDots query selector, that sets the `this` to a new origin.

The `-dash` rule is **static**. This means that it completely disregards the `this` *coming into* the `-dash` rule reaction; it always originate from the `currentElement` and `currentAttribute` that was set at the outset of the reaction. Always.

## `-dash` rule queries

The `-dash` rule is divided into three queries:
1. direction query
2. element query
3. attribute query

`:<-direction>?<--element>?<---attribute>`

In addition to the composed queries above, there are four special `:-dash` rules:
1. `:---` => `.currentAttribute`
2. `:-.` => `e`vent
3. `:-..` => `oi` outputInput
4. `:-` => `.currentElement`

If there are no matching elements, or no matching attributes, then the `-dash` rule will fail with a `DashRuleError`. This will break the current reaction chain and leave an `Error` in the virtual event loop.

## The direction query

The direction query specify the *orientation* that the `-dash` rule should go. Each direction is specified with a single "direction letter":

1. `c` ("child") goes down to the children nodes, but not descendants. `c` starts with the first child, and ends with the last child.
2. `l` ("lastchild") also goes down to the children nodes, but not descendants. But `l` starts with the last child and goes in reverse direction to the first child.
3. `p` ("parent") goes *up* to the parentNode, and then upwards to other ancestor within the same document.
4. `n` ("next") goes *sideways right* from the `currentElement` to the `nextSiblingElement` and its `nextSiblingElement` until the end. 
5. `m` ("previous") goes *sideways left* from the `currentElement` to the `previousSiblingElement` and its `previousSiblingElement` until the end. 
6. `t` ("target") goes *up* from the event's target in the DOM, and then upwards to the currentElement and beyond to its ancestors within the same document.

To each direction letter, the direction query can be given a number. This number specifies the exact child or ancestor queried based on position.

#### Examples of directions
`:-c` => `e.currentElement.children`
`:-c0` => `e.currentElement.children[0]` / `.firstChildElement`
`:-c1` => `e.currentElement.children[1]`
`:-l` => `e.currentElement.reverse(children)`
`:-l0` => `e.currentElement.children[-1]` / `.lastChildElement`
`:-l1` => `e.currentElement.children[-2]`
`:-p` => `iterateUpwards(e.currentElement.parentNode)`
`:-p0` => `e.currentElement.parentNode`
`:-p1` => `e.currentElement.parentNode.parentNode`
`:-m` => `iterateBackwards(e.currentElement.previousSiblings)`
`:-m0` => `e.currentElement.previousSiblingElement`
`:-m1` => `e.currentElement.previousSiblingElement.previousSiblingElement`
`:-n` => `iterateForwards(e.currentElement.nextSiblingElement)`
`:-n0` => `e.currentElement.nextSiblingElement`
`:-n1` => `e.currentElement.nextSiblingElement.nextSiblingElement`
`:-t` => `iterateUpwards(e.target.parentNode)`
`:-t0` => `e.target.parentNode`
`:-t1` => `e.target.parentNode.parentNode`

 * If the `:-` empty `-dash` rule is given, then the `currentElement` is set as `this` origin.

 * The implied direction when the `-dash` rule skips the direction and jumps straight to the element query is **descandants**, depth-first same as `querySelector`.

## The element query

The element query is a barebones `querySelector()`. The element query is applied to the element set given by the direction query. The element query consists of three parts:
1. type: `[a-z](a-z0-9-)*`. Only simple type names with english letters `a-z`, `0-9` and non-sequential `-` is allowed. 
2. attribute (and value): Listed as a sequence prefixed with single `_` and attribute name with an optional value prefixed by `__`. Again, only simple type attribute names and values with english letters `a-z`, `0-9` and non-sequential `-` is allowed. 
3. class list: list of `.` separated names. Class names can only include the same characters as types and attributes.

If there is no element query, then the first from the direction query is used. If no direction query neither, then the `currentElement` will be used.

### syntax

`--(<type>)?(_<attr>(__<value>)?)*(.class)*`

where:
1. type => `[a-z](a-z0-9-)?` with *no* double dashes `--`
2. attr => `[a-z](a-z0-9-)?` with *no* double dashes `--`
3. value => `(a-z0-9-)?` with *no* double dashes `--`
4. class => `(a-z0-9-)` with *no* double dashes `--` and at least on letter a-z

### How does it work

The element query will find the first element in the given direction. If the direction and query cannot be converted into a complete querySelector, then the rule will be `.match(querySelector)` against the elements given one by one by the direction query. If the `:-dash` rule has no direction query and jumps directly to the `:--element` query, then it will run as a `querySelector` on the descendants of the `currentElement`.

Examples of conversion:
1. `:--input_type__checkbox.is-active` => `input[type="checkbox"].is-active`
2. `:-m1--.bob` => `:has(.bob+*+:root)`
3. `:-n0--.hello-sunshine` => `:root + .hello-sunshine`
4. `:-p--form_action` => iterateUpwards `.parentNode` to the first parentNode that `.match("form[action]")`.
5. `:-c--pre` => `:root > pre`
6. `:-c3` => `:root:nth-child(3)`
7. `:-l3--i` => `:root > i:nth-last-child(3)`

The converted querySelector  can be applied to the currentElement. The direction and element query will in total produce only one element.

## Attribute query

An attribute query such as `:---attribute_name` finds the first attribute on the `.currentElement` that starts with `attribute_name` or `attribute:name`. The format of the attribute query is `---<query>`, where `query` must be `[a-z](a-z0-9_\.-)*`. The attribute query matches the start of the first attribute on the element selected using the direction+element query. If no attribute query is given, then the element from the direction+element is returned. Both `:` and `_` in the actual attribute are treated as `_` in the query.

```js
function attributeQuery(el, query){
  for (let a of el.attributes)
    if (a.name.replaceAll(":", "_").startsWith(query))
      return a;
}
```

## Why is the `-dash` rule **static**?

We want the relationship between the ownerElement and the reactions to be short. And we want them to have strong gravity towards the nexus of the reaction, the `currentElement` and `currentAttribute`. The static quality of the queries work this way. It makes the path go out like rays of sunshine from a single location. This helps make the path shorter, and when the position of the reaction is in the center of a more complex setup, this makes the reaction chain look much more readable. It leads to code hygiene.

The `-dash` rule is a **static** reaction. Static reactions means that they will *work the same regardless of their position in the reaction chain*. To achieve this feat, the `-dash` rule doesn't use the `this`, but instead *always originate from the `e.currentElement` and `e.currentAttribute`.

Note. Static is a choice. It can cause confusion. The alternative to static interpretation is a dynamic interpretation of `:-` that would originate from the `this`. Dynamic query reactions/rules are fine. But they might also cause confusion in their own way. So again, a choice was made. But if you want, make your own dynamic `-dash` rule and flow with it. It was meant to be;)


## Implementation

```js
function dashOi(e, oi){
  if (oi instanceof Object)
    return customReactions.origin(oi);
  throw new DashReactionError(`"${oi}" is not an Object.`);
}

function attributeQuery(query, el){
  for (let a of el.attributes)
    if (a.name.replaceAll(":", "_").startsWith(query))
      return a;
}

function elQuerySelector(query){
  let [typeAttr, ...classes] = query.split(".");
  classes = classes.join(".");
  let [type, ...attr] = typeAttr.split(/(?<!_)_(?!_)/); 
  if(attr.length)
    attr = attr.map(a => a.split("__")).map(([n,v]) => v ? `[${n}="${v}"]`: `[${n}]`);
  return type + attr + classes;
}

function* upwardsIterator(el) {
  while (el instanceof Element) {
    yield el;
    el = el.parentNode;
  }
}

// function* previousSiblingIterator(el) {
//   while (el instanceof Element) {
//     el = el.previousSiblingElement;
//     yield el;
//   }
// }

// function* nextSiblingIterator(el) {
//   while (el instanceof Element) {
//     el = el.nextSiblingElement;
//     yield el;
//   }
// }

function upwardsNumber(number, root) {
  for (let i = 0; i < number; i++) {
    root = root.parentNode;
    if (!(root instanceof Element))
      throw new DashRuleError("iterating upwards index out of range");
  } 
  return root;
}

function dirQuerySelector(dir, elQuery) {
  const type = dir[0];
  const number = parseInt(dir.substring(1));
  
  if(type === "c") {
    const tail = isNaN(number) ? "" : `:nth-child(${number})`;
    const query = `:root > ${elQuery}${tail}`;
    return e => e.currentElement.querySelector(query);
  }
  if(type === "l") {
    const tail = isNaN(number) ? "" : `:nth-last-child(${number})`;
    const query = `:root > ${elQuery}${tail}`;
    return e => e.currentElement.querySelector(query);
  }
  if (type === "m") {
    const plusStar = number > 0 ? '+*'.repeat(number) + '+' : '+';
    const query = `${elQuery}:has(${plusStar}:root)`;
    return e => e.currentElement.querySelector(query);
  }
  if (type === "n") {
    const plusStar = number > 0 ? '+*'.repeat(number) + '+' : '+';
    const query = `:root ${plusStar} ${elQuery}`;
    return e => e.currentElement.querySelector(query);
  }
  if (type === "p") {
    if ((isNaN(number) || number === 0) && !elQuery)
      return e => e.currentElement.parentNode;
    if(number && !elQuery){
      const func = upwardsNumber.bind(null, number);
      return e => func(e.currentElement.parentNode);
    }
    if(isNaN(number) && elQuery){
      return function(e) {
        for (let p of upwardsIterator(e.currentElement.parentNode)) {
          if (!p || !(p instanceof Element))
            throw new DashRuleError("parent direction with query didn't match");
          if (p.matches(elQuery))
            return p;
        }
      }
    }
    if(!isNaN(number) && elQuery){
      const func = upwardsNumber.bind(null, number);
      return function(e){
        const el = func(e.currentElement.parentNode);
        if(el.matches(elQuery))
          return el;
        throw new DashRuleError("parent direction with number and query didn't match");
      }
    }
  }
  if (type === "t") {
    if ((isNaN(number) || number === 0) && !elQuery)
      return e => e.target;
    if(number && !elQuery){
      const func = upwardsNumber.bind(null, number);
      return e => func(e.target);
    }
    if(isNaN(number) && elQuery){
      return function(e) {
        for (let p of upwardsIterator(e.target)) {
          if (!p || !(p instanceof Element))
            throw new DashRuleError("parent direction with query didn't match");
          if (p.matches(elQuery))
            return p;
        }
      }
    }
    if(!isNaN(number) && elQuery){
      const func = upwardsNumber.bind(null, number);
      return function(e){
        const el = func(e.target);
        if(!el.matches(elQuery))
          return el;
        throw new DashRuleError("parent direction with number and query didn't match");
      }
    }
  }
}

//todo memoize dashRule function
customReactions.defineRule("-", function dashRule(name) {
  if (name==="")
    return e => customReactions.origin(e.currentElement);
  // if (name==="-") There is an opening for `:--`
  //   return e => customReactions.origin(Free_notYetInUse);
  if (name==="--") 
    return e => customReactions.origin(e.currentAttribute);
  if (name===".") 
    return e => customReactions.origin(e);
  if (name==="..")
    return dashOi;
  
  //direct attribute query
  if (name.startsWith("--")){
    const funAttr = attributeQuery.bind(null, name.substring(2));
    return e => funAttr(e.currentElement);
  }
  
  const [dirEl, attr] = name.split("---");
  const funAttr = attr ? attributeQuery.bind(null, attr) : undefined;
  const [dir, el] = dirEl.split("--");
  if(!dir)
    return e => e.currentElement.querySelector("elQuery");
  const elQS = elQuerySelector(el);
  const funQS = dirQuerySelector(dir, elQS);
  
  return function dashReaction(e, oi){
    let o = e.currentElement;
    funQS && (o = funQS(e));
    if (!o)
      throw new DashRuleException("element not found");
    funAttr && (o = funAttr(o));
    if (!o)
      throw new DashRuleException("attribute not found");
    return customReactions.origin(o);
  }
});
```

## Problems 

The syntax of the element query (and the `-dash` rule) is likely to annoy you. We feel ya. The reason it is like this is that we are restricted to a minimal character set. This is limiting. Sorry.

many roads not taken. 
1. No nesting of such queries. 
2. No dynamic queries that allow you to build and branch from the current `this`.
3. It could fail silently. Work as a filter. But, the `Error` will not halt propagation, and so we find adding an `Error` for dash rule failures appropriate. You don't want to have missing dash rules in your code. Then make a different rule for filtering on find.

## Have your cake and eat it

If you want, you can always create your own custom reactions that alters the origin of the reaction chain by returning an object wrapped in `customReactions.origin(obj)`. It is also possible to not implement the default `-` dash rule, or implement your own version of the `-` dash rule.

Thus, different developers can use different objects as their origin root for their reaction chain. It is therefore possible to go to a more jQuery, Set/monadic style if you want. 

The use and combination of dash and dot reactions was originally built to support ease of implementation of gestures where gestures create children reactions that quickly need to transpose their reactions onto the gesture state machine reaction, and where the gesture state machine also needs to hide the definition of its own reaction within its own namespace, so as to not flood the global reaction registry with possible many longwinded and likely overlapping custom reaction functions.

## 4. Chains, monads, nested functions, or what?

A chain reaction is just a sequence of custom reaction functions called one after another. Simple. And some of you might have encountered similar structures as function chaining and monads. For example in JS arrays and jQuery. Or you might recognize them as a series of linearly nested functions.
 
It is possible to argue that the custom reactions are monadic. The monad would be the attribute itself, and the custom reactions are then mapped against this attribute. The attribute (with the `oi` property) gives a viewpoint/pin-hole-frame of the DOM, and each reaction alters the underlying state. Not unlike a monad. Sure.

But. Personally. I think that the conceptual model `trigger => filter => effect` is a more useful perspective. This perspective readily describe what you will be making 95% of the time. And this structure will make your code concise, readable and super effective.

In addition to such normal custom reaction chains, you have a second type `attr-change:machine="state"` reaction. These statemachines we will return to shortly.
