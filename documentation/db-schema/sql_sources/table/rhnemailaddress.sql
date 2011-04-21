-- created by Oraschemadoc Thu Apr 21 10:03:21 2011
-- visit http://www.yarpen.cz/oraschemadoc/ for more info

  CREATE TABLE "SPACEWALK"."RHNEMAILADDRESS" 
   (	"ID" NUMBER NOT NULL ENABLE, 
	"ADDRESS" VARCHAR2(128) NOT NULL ENABLE, 
	"USER_ID" NUMBER NOT NULL ENABLE, 
	"STATE_ID" NUMBER NOT NULL ENABLE, 
	"NEXT_ACTION" DATE, 
	"CREATED" DATE DEFAULT (sysdate) NOT NULL ENABLE, 
	"MODIFIED" DATE DEFAULT (sysdate) NOT NULL ENABLE, 
	 CONSTRAINT "RHN_EADDRESS_ID_PK" PRIMARY KEY ("ID")
  USING INDEX PCTFREE 10 INITRANS 2 MAXTRANS 255 COMPUTE STATISTICS
  STORAGE(INITIAL 65536 NEXT 1048576 MINEXTENTS 1 MAXEXTENTS 2147483645
  PCTINCREASE 0 FREELISTS 1 FREELIST GROUPS 1 BUFFER_POOL DEFAULT)
  TABLESPACE "USERS"  ENABLE, 
	 CONSTRAINT "RHN_EADDRESS_UID_SID_UQ" UNIQUE ("USER_ID", "STATE_ID")
  USING INDEX PCTFREE 10 INITRANS 2 MAXTRANS 255 COMPUTE STATISTICS
  STORAGE(INITIAL 65536 NEXT 1048576 MINEXTENTS 1 MAXEXTENTS 2147483645
  PCTINCREASE 0 FREELISTS 1 FREELIST GROUPS 1 BUFFER_POOL DEFAULT)
  TABLESPACE "USERS"  ENABLE, 
	 CONSTRAINT "RHN_EADDRESS_UID_FK" FOREIGN KEY ("USER_ID")
	  REFERENCES "SPACEWALK"."WEB_CONTACT" ("ID") ON DELETE CASCADE ENABLE, 
	 CONSTRAINT "RHN_EADDRESS_SID_FK" FOREIGN KEY ("STATE_ID")
	  REFERENCES "SPACEWALK"."RHNEMAILADDRESSSTATE" ("ID") ENABLE
   ) PCTFREE 10 PCTUSED 40 INITRANS 1 MAXTRANS 255 NOCOMPRESS LOGGING
  STORAGE(INITIAL 65536 NEXT 1048576 MINEXTENTS 1 MAXEXTENTS 2147483645
  PCTINCREASE 0 FREELISTS 1 FREELIST GROUPS 1 BUFFER_POOL DEFAULT)
  TABLESPACE "USERS" ENABLE ROW MOVEMENT 
 
/
