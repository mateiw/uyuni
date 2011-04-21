-- created by Oraschemadoc Thu Apr 21 10:03:14 2011
-- visit http://www.yarpen.cz/oraschemadoc/ for more info

  CREATE TABLE "SPACEWALK"."RHNACTION" 
   (	"ID" NUMBER NOT NULL ENABLE, 
	"ORG_ID" NUMBER NOT NULL ENABLE, 
	"ACTION_TYPE" NUMBER NOT NULL ENABLE, 
	"NAME" VARCHAR2(128), 
	"SCHEDULER" NUMBER, 
	"EARLIEST_ACTION" DATE NOT NULL ENABLE, 
	"VERSION" NUMBER DEFAULT (0) NOT NULL ENABLE, 
	"ARCHIVED" NUMBER DEFAULT (0) NOT NULL ENABLE, 
	"PREREQUISITE" NUMBER, 
	"CREATED" DATE DEFAULT (sysdate) NOT NULL ENABLE, 
	"MODIFIED" DATE DEFAULT (sysdate) NOT NULL ENABLE, 
	 CONSTRAINT "RHN_ACTION_ARCHIVED_CK" CHECK (archived in (0, 1)) ENABLE, 
	 CONSTRAINT "RHN_ACTION_PK" PRIMARY KEY ("ID")
  USING INDEX PCTFREE 10 INITRANS 2 MAXTRANS 255 COMPUTE STATISTICS
  STORAGE(INITIAL 65536 NEXT 1048576 MINEXTENTS 1 MAXEXTENTS 2147483645
  PCTINCREASE 0 FREELISTS 1 FREELIST GROUPS 1 BUFFER_POOL DEFAULT)
  TABLESPACE "USERS"  ENABLE, 
	 CONSTRAINT "RHN_ACTION_OID_FK" FOREIGN KEY ("ORG_ID")
	  REFERENCES "SPACEWALK"."WEB_CUSTOMER" ("ID") ON DELETE CASCADE ENABLE, 
	 CONSTRAINT "RHN_ACTION_AT_FK" FOREIGN KEY ("ACTION_TYPE")
	  REFERENCES "SPACEWALK"."RHNACTIONTYPE" ("ID") ENABLE, 
	 CONSTRAINT "RHN_ACTION_SCHEDULER_FK" FOREIGN KEY ("SCHEDULER")
	  REFERENCES "SPACEWALK"."WEB_CONTACT" ("ID") ON DELETE SET NULL ENABLE, 
	 CONSTRAINT "RHN_ACTION_PREREQ_FK" FOREIGN KEY ("PREREQUISITE")
	  REFERENCES "SPACEWALK"."RHNACTION" ("ID") ON DELETE CASCADE ENABLE
   ) PCTFREE 10 PCTUSED 40 INITRANS 1 MAXTRANS 255 NOCOMPRESS LOGGING
  STORAGE(INITIAL 65536 NEXT 1048576 MINEXTENTS 1 MAXEXTENTS 2147483645
  PCTINCREASE 0 FREELISTS 1 FREELIST GROUPS 1 BUFFER_POOL DEFAULT)
  TABLESPACE "USERS" ENABLE ROW MOVEMENT 
 
/
