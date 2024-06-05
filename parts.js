var parts = function() {
	jb.logic = {
		findClosingBracket(str, pos) {
			const rExp = /\(|\)/g
			rExp.lastIndex = pos + 1
			let deep = 1
			for (const match of str.matchAll(rExp)) {
				deep += (match[0] === "(") ? 1 : -1
				if (!deep) return match.index
			}
		},
		processLogicStr(str) {
			const _p = /\(/g
			const _bool = /(\B[\"\-+<>~\(]|\b[\*\)"]\B)/g 			// /([^\w\s']\b|\b[\*\)"])/g
	
			let a = []
			let r = []
	
			if (str.charAt(0) !== "(") str = `(${str})`
	
			const rExp = /\(|\)/g
			for (const match of str.matchAll(rExp)) {
				switch (match[0]) {
					case '(':
						a.push(match.index)
						break
					case ')':
						let level = str.substring(a.pop() + 1, match.index)
	
						let pOpen = Array.from(level.matchAll(_p), e => e.index).reverse()
						// Replace terms in parentheses with their processed versions (saved in r)
						pOpen.forEach((p, i) => {
							let pTerm = r.pop()
							let term = level.slice(p + 1, this.findClosingBracket(level, p))
	
							if (!pTerm.includes("(") || (pTerm.match(_p)?.length == term.match(_p)?.length)) {
								level = level.replace(term, pTerm)
							} else {
								r.push(pTerm)
							}
						})
	
						let andIdx = new Set()
						level = level
							.split(/\s+(AND|OR)\s+/gi)
							.map((e, i) => {
								if (e.charAt(0) === "(") return e // Term is already processed
								e = e.replaceAll("'", "\\'")
								if (/(\s|[\-+@]$)/g.test(e) && !_bool.test(e)) e = `"${e}"` //Old: /\s/g || If there's spaces, but no Boolean Mode operators, wrap with ""
								if (/^AND$/i.test(e)) andIdx.add(i - 1).add(i + 1)
								if (/^(OR|AND)$/i.test(e)) e = " "
								return e
							})
	
						andIdx.forEach(i => level[i] = "+" + level[i])
	
						r.push(level.join(''));
						break
	
				}
		  }
		  return r.toString()
		}
	}
}
