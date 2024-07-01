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
		},
		setTime(id, val) {
			let field = parasql.app.getWidgetById(id)
			let dv = field.getDataValue()
			dv.setTime(val)
			field.setDataValue(dv)
		},
		setDateTime(id, val) {
			let field = parasql.app.getWidgetById(id)
			let dv = field.getDataValue()
			dv.setDateTime(val)
			field.setDataValue(dv)
		},
		setVal(id, val) {
			const dataTypes = {
				date: "Date",
				time: "Time",
				datetime: "DateTime",
				double: "Number",
				varchar: "String"
			}
			let field = parasql.app.getWidgetById(id)
			let dv = field.getDataValue()
			let dt = dataTypes[field.getDatatype()]
			dv['set' + dt](val)
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

	/** Keyboard Navigation for Multi-Select Report widgets
 	* Usage: 
 	* - HTML widget: render -> call kbNav.setup(tableWidget_ID)
   	* - Report widget w/ multiselect: rendercell -> call kbNav.makeFocusable(event.target) // event.target = tableWidget
	**/
	this.kbNav = {
		setup: function(tblId) {
			$('body').off('keydown').on('keydown', e => {
				const keyCodes = {
					enter: 13,
					space: 32,
					up: 38,
					down: 40			
				}
	
				const tbl =  parasql.app.getWidgetById(tblId)
	
				if (!tbl.isVisible()) {
					$(this).off(e)
				} else if (e.target == tbl.widgetDiv && Object.values(keyCodes).includes(e.keyCode)) {
					e.preventDefault()
					const rowIdx = tbl.getSelectedRowIndex()
					const rowCt = tbl.getDataTable().rows.length
					switch (e.keyCode) {
						case keyCodes.space: 
							let row = tbl.getDataTable().getRowAt(rowIdx)
	
							row.toggleSelected()
							$(tbl.widgetDiv).find(`[data-parasql-row-multiselect=${rowIdx}] i`)
								.html(row.getIsSelected() ? 'check_box' : 'check_box_outline_blank')
	
							break;
						case keyCodes.up:
							tbl.setSelectedRowIndex(Math.max(rowIdx - 1, 0))
							break;
						case keyCodes.down:
							tbl.setSelectedRowIndex(Math.min(rowIdx + 1, rowCt - 1))
							break;
						case keyCodes.enter:
							let dblclick = new MouseEvent("dblclick", {
								view: window,
								bubbles: true,
								cancelable: true,
								ctrlKey: e.ctrlKey,
								shiftKey: e.shiftKey,
								altKey: e.altKey,
								metaKey: e.metaKey
							  });
	
	
							let selRow = $(tbl.widgetDiv).find(`[data-parasql-row-index=${rowIdx}]`).get(0)
							selRow.dispatchEvent(dblclick)
	
							function selectTbl(records, observer) {
								records.forEach(function (r) {
									if (typeof r.removedNodes == "object") {
										if ($(r.removedNodes).is("div.modal-underlay")
											&& $(r.previousSibling).is('div.MasterLayout')
											&& !r.nextSibling
										   ) {
											$(tbl.widgetDiv).focus()
											observer.disconnect()
										}
									}
								})
							}
	
							(new MutationObserver(selectTbl)).observe(document.body, { childList: true }); // Listen for DOM changes
	
							break;
					}
				}
			})
		},
		makeFocusable: function (tblWidget) {
			const dc = tblWidget.getLastRenderedDataCell()
			
			const lastCol = tblWidget.columns.filter(c => !c.isHidden).slice(-1)[0].columnName
			const rowId = dc.dataCellDiv.closest('.DataRow').dataset.parasqlRowIndex
	
			// Make Report "focusable"; only fire on data row 1 (& on the last visible column)
			if (rowId == 0 && dc.columnName == lastCol) {
				tblWidget.widgetDiv.tabIndex = 0
				tblWidget.widgetDiv.style.outline = 'none'
			}
		}	
	}


	this.QuickSearch = class {
		static btnStr = contains => `.ModalPanel .header-bar:contains('Search - ${contains}') .button`
		
		static ExampleConfig = {
			tbl: '*DB TableName',
			name: "Modal Panel Name (sans 'Search - ')",
			ids: {
				panel: '*Modal panel',
				tbl: '*Table',
				qSearch: '*Virtual.QuickSearch',
				searchBtn: '*Search btn',
				clearFilterBtn: 'Clear Filter btn',
				toggleFilter: 'Virtual.Filter (default "master filter" toggle)',
				searchFilter: {
					FieldName1: 'ID for Virutal.[FieldName1]',
					FieldName2: 'ID for Virutal.[FieldName2]'
				}
			},
			filter: {
				true: "Value for when 'All' not checked (filter applied, DEFAULT)",
				false: "Value for when 'All' is checked (filter not applied)"
			}
		}
		
		constructor(config, applyIds, searchFilter=null) {
			this.tbl = config.tbl
			this.btn = _utils.QuickSearch.btnStr(config.name || this.tbl)
			this.filter = config.filter
			this.ids = config.ids
			this.ids.apply = applyIds
			this.searchFilter = searchFilter
			
			this.open = true
			
			parasql.app.getWidgetById(this.ids.panel).show()
			parasql.app.getWidgetById(this.ids.qSearch).focus()
	
			this.setCloseEvent()
			
			if (this.filter) {
				this.chkbox = '#filter'
				this.filterVal = this.filter.true
				this.setFilterEvent()
			}
			if (this.searchFilter) {
				Object.entries(config.ids.searchFilter).forEach(([col, id]) => {
					if (col in searchFilter) 
						_utils.dv.setVal(id, searchFilter[col])
				})
			}
	
			this.refresh()
		}
		setCloseEvent() {
			let $modalCloseBtn = $(this.btn)
			if (this.open && !($._data($modalCloseBtn[0], 'events'))?.click)
				$modalCloseBtn.click((e) => this.reset())
		}
		setFilterEvent() {
			if (this.open) 
				$(this.chkbox).change(e => this.filterOnChange(e.target))
		}
		loadChkBox() { 
			if (this.open && this.filterVal == this.filter.false) 
				$(this.chkbox).prop('checked', true) 
		}
		filterOnChange(e) {
			this.filterVal = this.filter[!$(e).is(":checked")]
			_utils.dv.setString(this.ids.toggleFilter, this.filterVal)
			this.search()
		}
		clearQSearch = () => parasql.app.getWidgetById(this.ids.qSearch).setDataValueNull()
		resetFilter = () => _utils.dv.setString(this.ids.toggleFilter, this.filter.true)
		search = () => { if (this.open) parasql.app.getWidgetById(this.ids.searchBtn).performClick() }
		refresh = () => parasql.app.getWidgetById(this.ids.tbl).refreshQuery()
		reset() {
			this.open = false;
			this.clearQSearch()
			if (this.ids.toggleFilter) this.resetFilter()
			if (this.ids.searchFilter) {
				Object.values(this.ids.searchFilter).forEach(id => parasql.app.getWidgetById(id).setDataValueNull())
				parasql.app.getWidgetById(this.ids.clearFilterBtn).performClick()
			}
		}
		clearApply() {
			if (this.ids.apply) Object.values(this.ids.apply).forEach(id => parasql.app.getWidgetById(id).setDataValueNull())
			this.reset()
		}
		apply() {
			let _tbl = parasql.app.getWidgetById(this.ids.tbl)
			if (this.ids.apply) Object.entries(this.ids.apply).forEach(([col, id]) => {
				parasql.app.getWidgetById(id).setDataValue(_tbl.getSelectedValue(this.tbl, col))
			})	
			this.reset()
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

	this.getPDFDownloadURL = function(textFieldData) {
		let data = textFieldData.split(';')
		if (data.length = 4) {
			this._filename = data[3] // database/files/{RAND-HEX-STR}.pdf
			this._downloadFilename = data[0] // Contract-Version-JBSchedule.pdf
	
			this.getSignedDownloadURLResponse = function(a) {
				parasql.ui.WaitPanel.hide();
				a = parasql.util.deserializeJsonResponse(a);
				if ("OK" == a.status) {
					a = a.data;
					var b = this._downloadFilename.replace(/"/g, " ");
					a += "&response-content-disposition=" + encodeURIComponent('inline; filename="' + b + '"');
					window.open(a)
				} else
					(new parasql.ui.MessagePanel("Error Retrieving Signed Download URL", "Contact JenBar IT for assistance.", a.errorMessage)).show()
			}
			parasql.util.sendAjaxMessage({
				header: "x-appsynergy-get-signed-download-url",
				object: {
					objectName: this._filename
				},
				target: this,
				action: this.getSignedDownloadURLResponse
			});
			parasql.ui.WaitPanel.show()
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
