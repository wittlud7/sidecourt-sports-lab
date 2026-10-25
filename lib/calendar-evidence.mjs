// ESPN's outer season may describe navigation, while events/requestedSeason
// describe the returned historical schedule. Use event evidence for its scope.
export function calendarEvents(raw,requested=''){return (raw.events||[]).filter(e=>!requested||String(e.season?.year??raw.requestedSeason?.year??raw.season?.year)===String(requested));}
export function calendarSeason(raw,requested=''){const events=calendarEvents(raw,requested),event=events.find(e=>e.season?.year),season=event?.season||raw.requestedSeason||raw.season;return season&&(!requested||String(season.year)===String(requested))?season:null;}
