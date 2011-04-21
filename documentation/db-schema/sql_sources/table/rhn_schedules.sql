-- created by Oraschemadoc Thu Apr 21 10:03:43 2011
-- visit http://www.yarpen.cz/oraschemadoc/ for more info

  CREATE TABLE "SPACEWALK"."RHN_SCHEDULES" 
   (	"RECID" NUMBER(12,0) NOT NULL ENABLE, 
	"SCHEDULE_TYPE_ID" NUMBER(12,0) NOT NULL ENABLE, 
	"DESCRIPTION" VARCHAR2(40) DEFAULT ('unknown') NOT NULL ENABLE, 
	"LAST_UPDATE_USER" VARCHAR2(40), 
	"LAST_UPDATE_DATE" DATE, 
	"CUSTOMER_ID" NUMBER(12,0), 
	 CONSTRAINT "RHN_SCHED_RECID_CK" CHECK (recid > 0) ENABLE, 
	 CONSTRAINT "RHN_SCHED_RECID_PK" PRIMARY KEY ("RECID")
  USING INDEX PCTFREE 10 INITRANS 2 MAXTRANS 255 COMPUTE STATISTICS
  STORAGE(INITIAL 65536 NEXT 1048576 MINEXTENTS 1 MAXEXTENTS 2147483645
  PCTINCREASE 0 FREELISTS 1 FREELIST GROUPS 1 BUFFER_POOL DEFAULT)
  TABLESPACE "USERS"  ENABLE, 
	 CONSTRAINT "RHN_SCHED_CSTMR_CUST_ID_FK" FOREIGN KEY ("CUSTOMER_ID")
	  REFERENCES "SPACEWALK"."WEB_CUSTOMER" ("ID") ENABLE, 
	 CONSTRAINT "RHN_SCHED_SCHTP_SCHED_TY_FK" FOREIGN KEY ("SCHEDULE_TYPE_ID")
	  REFERENCES "SPACEWALK"."RHN_SCHEDULE_TYPES" ("RECID") ENABLE
   ) PCTFREE 10 PCTUSED 40 INITRANS 1 MAXTRANS 255 NOCOMPRESS LOGGING
  STORAGE(INITIAL 65536 NEXT 1048576 MINEXTENTS 1 MAXEXTENTS 2147483645
  PCTINCREASE 0 FREELISTS 1 FREELIST GROUPS 1 BUFFER_POOL DEFAULT)
  TABLESPACE "USERS" ENABLE ROW MOVEMENT 
 
/
