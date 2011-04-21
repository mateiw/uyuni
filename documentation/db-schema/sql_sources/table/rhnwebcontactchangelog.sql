-- created by Oraschemadoc Thu Apr 21 10:03:38 2011
-- visit http://www.yarpen.cz/oraschemadoc/ for more info

  CREATE TABLE "SPACEWALK"."RHNWEBCONTACTCHANGELOG" 
   (	"ID" NUMBER, 
	"WEB_CONTACT_ID" NUMBER NOT NULL ENABLE, 
	"WEB_CONTACT_FROM_ID" NUMBER, 
	"CHANGE_STATE_ID" NUMBER NOT NULL ENABLE, 
	"DATE_COMPLETED" DATE DEFAULT (sysdate) NOT NULL ENABLE, 
	 CONSTRAINT "RHN_WCON_CL_ID_PK" PRIMARY KEY ("ID")
  USING INDEX PCTFREE 10 INITRANS 2 MAXTRANS 255 COMPUTE STATISTICS
  STORAGE(INITIAL 65536 NEXT 1048576 MINEXTENTS 1 MAXEXTENTS 2147483645
  PCTINCREASE 0 FREELISTS 1 FREELIST GROUPS 1 BUFFER_POOL DEFAULT)
  TABLESPACE "USERS"  ENABLE, 
	 CONSTRAINT "RHN_WCON_CL_WCON_ID_FK" FOREIGN KEY ("WEB_CONTACT_ID")
	  REFERENCES "SPACEWALK"."WEB_CONTACT" ("ID") ON DELETE CASCADE ENABLE, 
	 CONSTRAINT "RHN_WCON_CL_WCON_FROM_ID_FK" FOREIGN KEY ("WEB_CONTACT_FROM_ID")
	  REFERENCES "SPACEWALK"."WEB_CONTACT" ("ID") ON DELETE SET NULL ENABLE, 
	 CONSTRAINT "RHN_WCON_CL_CSID_FK" FOREIGN KEY ("CHANGE_STATE_ID")
	  REFERENCES "SPACEWALK"."RHNWEBCONTACTCHANGESTATE" ("ID") ENABLE
   ) PCTFREE 10 PCTUSED 40 INITRANS 1 MAXTRANS 255 NOCOMPRESS LOGGING
  STORAGE(INITIAL 65536 NEXT 1048576 MINEXTENTS 1 MAXEXTENTS 2147483645
  PCTINCREASE 0 FREELISTS 1 FREELIST GROUPS 1 BUFFER_POOL DEFAULT)
  TABLESPACE "USERS" ENABLE ROW MOVEMENT 
 
/
