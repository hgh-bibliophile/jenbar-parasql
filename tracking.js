var tracking = function() { 
	let _tracking = this

  this.pullGeotabLocations = function (onSuccessCB = null, onErrorCB = null) {
  	let sql = 'SELECT Vehicle_ID, Geotab_ID FROM Vehicle WHERE Geotab_ID IS NOT NULL AND SaleDate IS NULL;'
  	parasql.ui.WaitPanel.show()
  	parasql.app.execSQL(sql, function(dt) {
  		let vehicles = dt.getRows().map(({ values }, i) => {
  			return {
  				index: i, 
  				vehicleId: values[0].getNumber(), 
  				geotabId: values[1].getString()
  			}
  		})
  		let vehicleSearches = vehicles.map(v => ['Get', {typeName: 'DeviceStatusInfo', search: {deviceSearch: {id: v.geotabId}}}])
  		jb.gt.api.multiCall(vehicleSearches)
  		.then(vehicleInfo => {
  			vehicleInfo.forEach((vInfo, i) => {
  				vInfo = vInfo[0]
  				vehicles[i].isDriving = vInfo.isDriving
  				if (vInfo.isDriving) vehicles[i].location = '(Driving)'
  				vehicles[i].locationTS = vInfo.dateTime
  				vehicles[i].coordinates = { x: vInfo.longitude, y: vInfo.latitude }
  			})
  			return jb.gt.api.call("GetAddresses",{coordinates:vehicles.map(v => v.coordinates)})
  		}).then(addressResults => {
  			let zoneIds = new Set()
  			addressResults.forEach((addr, i) => {
  				vehicles[i].address = addr
  				if (addr.zones) {
  					const addrZones = addr.zones.map(z => z.id)
  					vehicles[i].zoneIds = addrZones
  					addrZones.forEach(zId => zoneIds.add(zId))
  				}   
  			})
  			const zoneSearches = Array.from(zoneIds).map(zId => ['Get', {typeName: 'Zone', search: {id: zId}}])
  			return jb.gt.api.multiCall(zoneSearches)
  		}).then(zoneResults => {
  			let zones = {}
  			let updateValues = []
  			zoneResults.forEach(z => zones[z[0].id] = z[0].name)
  			Object.values(vehicles).forEach(v => {
  				if (v.zoneIds) v.zones = v.zoneIds.map(id => zones[id])
  				if (dayjs().diff(v.locationTS, 'hour') <= 6) {
  					v.location ??= v.zones ? v.zones.join() : `${v.address.city ?? v.formattedAddress.match(/^.*, (.*), [A-Z]{2} \d{5}, USA$/)[1]}, ${v.address.region}`
  					updateValues.push(`(parasql_next_val('Vehicle_GeotabSync'),${v.vehicleId},'${v.location}',${v.coordinates.y},${v.coordinates.x},CONVERT_TZ('${new Date().toISOString().replace(/(.*)T(.*)\.\d{0,3}Z/g, '$1 $2')}','GMT','America/New_York'))`) //${v.locationTS}
  				}
  			})
        
  			let updateSQL = `INSERT INTO Vehicle_GeotabSync (Vehicle_GeotabSync_ID, Vehicle_ID, Location, Latitude, Longitude, LocationTS) VALUES ${updateValues}`
  			updateSQL += ' ON DUPLICATE KEY UPDATE Location=VALUES(Location), Latitude=VALUES(Latitude), Longitude=VALUES(Longitude), LocationTS=VALUES(LocationTS);'
  			parasql.app.execSQL(updateSQL, function (dt) {
  				if (onSuccessCB) onSuccessCB(dt)
  				parasql.ui.WaitPanel.hide()
  			}, onError)
  		}).catch(onError)
  	}, onError)
  	
  	function onError(e) {
  		console.log(e)  		
		onErrorCB(e)
		parasql.ui.WaitPanel.hide()
  	}
  }
}
