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
  
	// --- Report Formatting Functions --- //
	this.format = {
		contract(contractName, $element) {
	  		const whiteFont = '#FFFFFF'
	  		const darkFont = '#000000'
	  
				const contracts = {
				'060ED': {
	  				tripBackColor: '#8e3e3e', // '#7AA8B8'
	  				lightTripFont: true
	  			},
	  	  		'13014': {
					tripBackColor: '#d8a6a6' // '#4E98B1'
				},
				'130A6': {
					tripBackColor: '#8e3e66', //'#4689A0'
					lightTripFont: true
				},
				'130BD': {
					tripBackColor: '#d095b3' // '#46A0A0'
				},
				'130HJ': {
					tripBackColor: '#663e8e', // '#71ADC1'
					lightTripFont: true
				},
				'130L8': {
					tripBackColor: '#5FA3B9' // '#5FA3B9'
				},
				'136A0': {
					tripBackColor: '#bfa6d8' // '#83B7C9'
				},
				'13729': {
					tripBackColor: '#3e668e', // '#7AA8B8'
					lightTripFont: true
				},
				'140L5': {
					tripBackColor: '#a6bfd8' // '#5993A6'
				},
				'144JE': {
					tripBackColor: '#3e8e7a', // '#3E8E8E'
					lightTripFont: true
				},
				'144JJ': {
					tripBackColor: '#a6d8cc' // '#7AA8B8'
				},
				'148L5': {
	  				tripBackColor: '#3e8e52', // '#4EB1B1'
					lightTripFont: true
				},
				'JenBar': {
					tripBackColor: '#b8e0c2' // '#A9A9A9'
				}
			}
			
			let tripBackColor = contracts[contractName]?.tripBackColor ?? '#999999'
			let tripFontColor = contracts[contractName]?.lightTripFont ? whiteFont : darkFont

			$element.css("background-color", tripBackColor);
			$element.css("color", tripFontColor);
		},
		empArea(areaName, $element) {
			const areaColors = {
				'Syracuse': '#3D778A',
				'Rochester': '#3D8A8A',
				'Philadelphia': '#506295',
				'Buffalo': '#508495',
				'Binghamton': '#3D638A',
				'Watertown': '#507395'
			}

			let areaColor = areaColors[areaName] ?? '#999999'
  
			$element.css("background-color", areaColor)
			$element.css("font-weight", 'bold')
			$element.css("color", 'white')
		},
		empSearch($element) {
			$element.css("background-color", '#CFE2F3')
		},
		empStatus(statusName, $element) {
			let statusColors = {
				'Unavailable': '#FF8080', // '#FFFF00' (Yellow); '#F08080' (Unavailable red)
				'Possible': '#FFDD99', // '#FFC000' (Bright orange); '#FA9448' (13014 orange)
				'Likely': '#A3C2C2', // '#0070C0 (Dark blue); '#00B0F0' (Light Blue)
			}
  
			let statusColor = statusColors[statusName] ?? 'unset' // Avoid setting background to white so that row highlighting still works
  
			if (statusColor != 'unset') {	//Don't apply the sytle if no changes made - affects other styles
				$element.css("background-color", statusColor);
			}
		},
		etoDate(dt, $element) {
			const colors = {
				curWk: "#85ADAD",
				altWk: "#A3C2C2",
				nxtWk: "#DEE9E9"//"#D8E5E5"
			}
  		
			let cp = new PayPeriod()
			let dtWk = dayjs(dt).isoWeek()
  		
			const wkGroup = (dayjs().isoWeek() == dtWk) ? "curWk" 
				: (cp.inPeriod(dt)) ? "altWk" 
				: (dayjs(cp.getDate(15)).isoWeek() == dtWk) ? "nxtWk"
				: null;
			
			if (wkGroup) $element.css("background-color", colors[wkGroup])	
		},
		shiftStatus(statusName, $element) {
			let statusColor = 'white'
			
			switch(statusName) {
				case 'Omitted':
				case 'Customer Cancelled':
				case 'Weather Cancelled':
				case 'Holiday Skip':
					statusColor = '#D9D9D9';
					break;
				case 'Pending':
					statusColor = '#a6b3d8';
					break;
				default:
			}
			if (statusColor != 'white') {	// Avoid setting background to white so that row highlighting still works
				$element.css("background-color", statusColor)
				$element.css("font-style", 'italic')
			}
		},
		unassigned($element) {
			$element.css("background-color", '#F08080')
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
