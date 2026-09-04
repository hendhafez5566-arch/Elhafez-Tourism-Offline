const CoreSuites={
 ready:{umrah:false},
 maps:{
  umrah:{dashboard:'umrah-dashboard','guided-program':'umrah-program-new','booking-wizard':'umrah-booking-new','guided-resume':'umrah-booking-resume',bookings:'umrah-bookings',travelers:'umrah-travelers',seasons:'umrah-seasons',contracts:'umrah-contracts',programs:'umrah-programs','program-workspace':'umrah-program-workspace',costing:'umrah-costing','guided-trip':'umrah-trip-ready',control:'umrah-control',hotels:'umrah-hotels',visas:'umrah-visas','hajj-services':'umrah-hajj-services',flights:'umrah-flights',transport:'umrah-transport',tripops:'umrah-tripops',incidents:'umrah-incidents',procurement:'umrah-procurement',documents:'umrah-documents',settings:'umrah-settings',advanced:'umrah-dashboard'}
 },
 reverse(name,hostPage){const map=this.maps[name]||{};return Object.keys(map).find(k=>map[k]===hostPage)||'dashboard'},
 init(name){if(name!=='umrah')return false;if(this.ready.umrah)return true;UmrahCore_DB.load();this.ready.umrah=true;return true},
 render(name,page){this.init(name);const internal=this.reverse(name,page);if(name==='umrah'){
   UmrahCore_UI.current=internal;
   if(internal==='guided-program'&&(!UmrahCore_ProgramWizard.data||!Object.keys(UmrahCore_ProgramWizard.data).length)){const st=UmrahCore_DB.data.uiState?.programWizard;if(st?.data?.creationToken){UmrahCore_ProgramWizard.step=st.step||1;UmrahCore_ProgramWizard.maxStep=Math.max(st.maxStep||1,st.step||1);UmrahCore_ProgramWizard.data=UmrahCore_deep(st.data||{});UmrahCore_ProgramWizard.normalize()}else{UmrahCore_ProgramWizard.step=1;UmrahCore_ProgramWizard.maxStep=1;UmrahCore_ProgramWizard.data=UmrahCore_ProgramWizard.defaults();UmrahCore_DB.data.uiState=UmrahCore_DB.data.uiState||{};UmrahCore_DB.data.uiState.programWizard={step:1,maxStep:1,data:UmrahCore_deep(UmrahCore_ProgramWizard.data)}}}
   if(internal==='booking-wizard'&&(!UmrahCore_Wizard.data||!Object.keys(UmrahCore_Wizard.data).length)){const st=UmrahCore_DB.data.uiState?.bookingWizard;if(st?.data){UmrahCore_Wizard.step=st.step||1;UmrahCore_Wizard.data=UmrahCore_deep(st.data||{})}else{UmrahCore_Wizard.step=1;UmrahCore_Wizard.data={date:UmrahCore_today(),programId:'',adults:1,childBed:0,childNoBed:0,infants:0,primaryRoomType:'single',roomTypeTouched:false,discount:0,status:'hold',sourceType:'direct',sourceAgentId:'',depositAmount:0,paymentMethod:'cash',treasuryId:'',travelerNames:''};UmrahCore_DB.data.uiState=UmrahCore_DB.data.uiState||{};UmrahCore_DB.data.uiState.bookingWizard={step:1,data:UmrahCore_deep(UmrahCore_Wizard.data)}}}
   UmrahCore_UI._lazyTables?.clear();
   if(internal!=='documents')UmrahCore_UI._documentsExpanded=false;
   const fn=UmrahCore_Pages[internal]||UmrahCore_Pages.dashboard;return `<div class="core-suite-page core-suite-umrah" data-core-suite="umrah" data-core-page="${esc(internal)}">${fn()}</div>`;
  }
  return '';
 },
 startProgram(){this.init('umrah');UmrahCore_ProgramWizard.start();return true},
 startBooking(programId=''){this.init('umrah');UmrahCore_Wizard.start(programId);return true}
};
