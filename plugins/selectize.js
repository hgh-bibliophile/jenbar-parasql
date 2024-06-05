function blur_on_tab (options) {
	let self = this			
	self.onKeyDown = (function() {
		let originalKeyDown = self.onKeyDown;
		return function(e) {
			if (e.keyCode == 9) {						
				let $matchedItem = self.getFirstItemMatchedByTextContent(self.lastValue, true)
				if (typeof $matchedItem.attr('data-value') !== 'undefined' && self.getValue() !== $matchedItem.attr('data-value'))
					self.onOptionSelect({currentTarget: $matchedItem})
				setTimeout(function () { self.blur() }, 0)
			}
			return originalKeyDown.apply(this, arguments)
		}
	}())
}
