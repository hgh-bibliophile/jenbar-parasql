var sched = function() { 
	let _sched = this

	// --- PayPeriod Class --- // extract to JB-utils script?
	
	this.PayPeriod = class {
		static refDate = '2023-09-11T00:00:00'
		static calcStartDate = function (calcDate) {
			const refDate = dayjs(PayPeriod.refDate)
			calcDate = dayjs(calcDate).startOf('d')
			const dDays = calcDate.diff(refDate, 'd')
			return calcDate.subtract(dDays % 14, 'd')
		}
		static isSame = (dt1, dt2) => (PayPeriod.calcStartDate(dt1).valueOf() == PayPeriod.calcStartDate(dt2).valueOf())
		constructor(calcDate = new Date()) {
			this._start = PayPeriod.calcStartDate(calcDate)
		}
		startDate = () => this._start.toDate()
		getDate = (day) => this._start.add(day - 1, 'd').toDate()
		getDay = (dt) => dayjs(dt).startOf('d').diff(this._start, 'd') + 1
		getWeek = (dt) => Math.ceil(this.getDay(dt) / 7) - 1
		inPeriod = (dt) => { 
			const day = this.getDay(dt)
			return (day >=1 && day <= 14)
		}
	}

	this.getMonday = function (dateInput) {
	  	const date = new Date(dateInput)
	  	const day = date.getDay() // Sunday - Saturday : 0 - 6
	  	//  Day of month - day of week (-6 if Sunday), otherwise +1
	   	const diff = date.getDate() - day + (day === 0 ? -6 : 1)
	  	date.setHours(0,0,0,0)
	  	date.setDate(diff)
	  	return date;
	}
  
	// Increment a date value by specified number of days
	this.incrementDate = function(dateInput, increment) {
	  	let increasedDate = dayjs(dateInput).add(increment, 'd')
	  	return increasedDate.toDate()
	}
  
	// Find the difference in days between date1 - date2
	this.dateDiff = function(date1, date2) {
 		return dayjs(date1).diff(dayjs(date2), 'd')
	}

	this.shiftDateSearch = function(shiftBy, beginId, endId = null) {

		let beginDV = parasql.app.getWidgetById(beginId).getDataValue();
		let beginDT = beginDV?.getDate();
  	
		if (endId) {
			let endDV = parasql.app.getWidgetById(endId).getDataValue();
			let endDT = endDV?.getDate();
	  
			if (beginDV.isNotNull() && endDV.isNotNull()) {
				const range = (shiftBy < 0) ? [beginDT, endDT] : [endDT, beginDT];
				const dateDiff = _sched.dateDiff(...range) + shiftBy;
	  			setDate(beginId, _sched.incrementDate(beginDT, dateDiff));
	  			setDate(endId, _sched.incrementDate(endDT, dateDiff));
	  
	  		} else if (beginDV.isNotNull()) {
	  			setDate(beginId, _sched.incrementDate(beginDT, shiftBy));
	  
	  		} else if (endDV.isNotNull()) {
	  			setDate(endId, _sched.incrementDate(endDT, shiftBy));
	  		}
	  		
	  	} else {
	  		setDate(beginId, _sched.incrementDate(beginDT, shiftBy));
	  	}
	}
  
	// Private function, referenced in shiftDateSearch()
	// Implemented in /utils.js:this.dv.setDate()
	function setDate(id, val) {
		let field = parasql.app.getWidgetById(id)
		let dv = field.getDataValue()
		dv.setDate(val)
		field.setDataValue(dv)
	}
}
