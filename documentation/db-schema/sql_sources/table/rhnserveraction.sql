-- created by Oraschemadoc Thu Apr 21 10:03:30 2011
-- visit http://www.yarpen.cz/oraschemadoc/ for more info

  CREATE TABLE "SPACEWALK"."RHNSERVERACTION" 
   (	"SERVER_ID" NUMBER NOT NULL ENABLE, 
	"ACTION_ID" NUMBER NOT NULL ENABLE, 
	"STATUS" NUMBER NOT NULL ENABLE, 
	"RESULT_CODE" NUMBER, 
	"RESULT_MSG" VARCHAR2(1024), 
	"PICKUP_TIME" DATE, 
	"REMAINING_TRIES" NUMBER DEFAULT (5) NOT NULL ENABLE, 
	"COMPLETION_TIME" DATE, 
	"CREATED" DATE DEFAULT (sysdate) NOT NULL ENABLE, 
	"MODIFIED" DATE DEFAULT (sysdate) NOT NULL ENABLE, 
	 CONSTRAINT "RHN_SERVER_ACTION_SID_AID_UQ" UNIQUE ("SERVER_ID", "ACTION_ID")
  USING INDEX PCTFREE 10 INITRANS 2 MAXTRANS 255 COMPUTE STATISTICS
  STORAGE(INITIAL 65536 NEXT 1048576 MINEXTENTS 1 MAXEXTENTS 2147483645
  PCTINCREASE 0 FREELISTS 1 FREELIST GROUPS 1 BUFFER_POOL DEFAULT)
  TABLESPACE "USERS"  ENABLE, 
	 CONSTRAINT "RHN_SERVER_ACTION_SID_FK" FOREIGN KEY ("SERVER_ID")
	  REFERENCES "SPACEWALK"."RHNSERVER" ("ID") ENABLE, 
	 CONSTRAINT "RHN_SERVER_ACTION_AID_FK" FOREIGN KEY ("ACTION_ID")
	  REFERENCES "SPACEWALK"."RHNACTION" ("ID") ON DELETE CASCADE ENABLE, 
	 CONSTRAINT "RHN_SERVER_ACTION_STATUS_FK" FOREIGN KEY ("STATUS")
	  REFERENCES "SPACEWALK"."RHNACTIONSTATUS" ("ID") ENABLE
   ) PCTFREE 10 PCTUSED 40 INITRANS 1 MAXTRANS 255 NOCOMPRESS LOGGING
  STORAGE(INITIAL 65536 NEXT 1048576 MINEXTENTS 1 MAXEXTENTS 2147483645
  PCTINCREASE 0 FREELISTS 1 FREELIST GROUPS 1 BUFFER_POOL DEFAULT)
  TABLESPACE "USERS" ENABLE ROW MOVEMENT 
 
/
