var utils = function() { 
	let _utils = this
	
	this.dv = {
		setString(id, val) {
			let field = parasql.app.getWidgetById(id)
			let dv = field.getDataValue()
			dv.setString(val)
			field.setDataValue(dv)
		},
		setNumber(id, val) {
			let field = parasql.app.getWidgetById(id)
			let dv = field.getDataValue()
			dv.setNumber(val)
			field.setDataValue(dv)
		},
		setDate(id, val) {
			let field = parasql.app.getWidgetById(id)
			let dv = field.getDataValue()
			dv.setDate(val)
			field.setDataValue(dv)
		}
	}

	
	this.expandDate = function(event) {
		let domTarget = event.domEvent.target;
		// check for jQuery keydown events on the dom input element...
		if (!($._data(domTarget, "events"))?.keydown) {
			// if none exists, assign a keydown event
			let $target = $(domTarget);
			$target.keydown(function(e) {
				// if the pressed key was Enter (13) or Tab (9)...
				if ([9, 13].includes(e.keyCode || e.which)) {
					// check the input value for "/yyyy"...	
					let dStr = $target.val();
					if (!dStr || dStr.startsWith("/")) return;
					if (!dStr.match(/^(\d{1,2}\/){2}\d{4}$/)) { // Proper m/d/yyyy format
						let dtPts = dStr.split("/")
						if (dtPts.length == 3 && dtPts[2]?.length <= 2) { // m/d/y or /yy
							// if missing, expand "yy" to "yyyy"
							dtPts[2] = dayjs().year().toString().substring(0,2) + dtPts[2].padStart(2, '0')
						} else {									
							// Or default to current year if missing "yy" entirely
							dtPts.push(dayjs().year())
						}
						$target.val(dtPts.join("/"));
					}
				}
			});
		}
	}

	this.expandHour = function(event) {
		let domTarget = event.domEvent.target;
		// check for jQuery keydown events on the dom input element...
		if (!($._data(domTarget, "events"))?.keydown) {
			// if none exists, assign a keydown event
			let $target = $(domTarget);
			$target.keydown(function(e) {
				// if the pressed key was Enter (13) or Tab (9)...
				if ([9, 13].includes(e.keyCode || e.which)) {
					// check the input value for ":x"...	
					let tStr = $target.val();
					if (!tStr.match(/:\w+$/)) {
						// if missing, add ":00" (or "00" if ":" is the last character) 
						// so parasql will accept it
						tStr += tStr.match(/:$/) ? "00" : ":00";
						$target.val(tStr);
					}
				}
			});
		}
	}

	this.download = {
		dlFile(blob, file) {
			const link = document.createElement('a')
			// create a blobURI pointing to our Blob
			link.href = URL.createObjectURL(blob)
			link.download = file
			// some browser needs the anchor to be in the doc
			document.body.append(link)
			
			link.click()
			link.remove()
			// in case the Blob uses a lot of memory
			setTimeout(() => URL.revokeObjectURL(link.href), 7000)
		},
		csv: {
			_(dt, fn) {
				if (fn.split('.').pop() !== 'csv') fn += '.csv'
				const csvBlob = new Blob([dt.toCSV()], { type: 'text/csv;charset=utf-8;' })		
				_utils.download.dlFile(csvBlob, fn)
			},
			tbl(id, filename) {
				let tblDT = parasql.app.getWidgetById(id).getDataTable()
				this._(tblDT, filename)
			},
			sql(sql, filename) {
				let _ = this._
				parasql.app.execSQL(sql, function(tblDT) {
					_(tblDT, filename)
				})
			}
		}
	}
	
	this.setConfirmClose = function(name, confirmStr) {
		let $btn = 	$(`.ModalPanel .header-bar:contains("${name}") .button`)
		let $icon = $btn.children()
		
		if ($btn.css('padding') === '0px') return
		
		$icon.css({ 'padding': $btn.css('padding'), 'border-radius': $btn.css('border-radius') })
		$btn.css('padding', '0px')
		
		$btn.hover(() => {
			$icon.css('border', $btn.css('border'))
			$btn.css('border', 'none')
		}, () => {
			$icon.css('border', 'none')
			$btn.css('border', '')
		})
		
		$icon.click(e => { 
			if (!confirm(confirmStr)) e.stopPropagation()
		})
	}

	// Copy a data record given the following:
	// recordObjectId - widgetID of the record object
	// rFields - restricted fields that will not be copied (like the primary key ID field)
	// eFields - edit fields (string only) that will have their contents prepended with the given prefix {"Name": "COPY: "}
	this.copyRecord = function(recordObjectId, rFields, eFields) {
		let recordObject = parasql.app.getWidgetById(recordObjectId)
		let dt = recordObject.getDataTable();
		let oldRecord = dt.getRowAt(recordObject.getSelectedRowIndex());
		let dtColumns = dt.getColumns();
	
		recordObject.addIndividualRecord();
		let newRecord = dt.getRowAt(recordObject.getSelectedRowIndex());
	
		for (let x = 0; x < dtColumns.length; x++) {
			let cName = dt.getColumns()[x].getColumnName();
			if (rFields.includes(cName)) {
				console.log("Restricted Field");
			} else if (Object.keys(eFields).includes(cName)){
				let dvStr = oldRecord.getValueAt(x).getString();
				newRecord.getValueAt(x).setString(eFields[cName] + dvStr);
			} else {
				newRecord.getValueAt(x).takeValueFrom(oldRecord.getValueAt(x));
			}			
		}
	
		recordObject.redisplay();	
	}
} 
