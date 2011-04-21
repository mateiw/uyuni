-- created by Oraschemadoc Thu Apr 21 10:03:41 2011
-- visit http://www.yarpen.cz/oraschemadoc/ for more info

  CREATE TABLE "SPACEWALK"."RHN_METHOD_TYPES" 
   (	"RECID" NUMBER(12,0) NOT NULL ENABLE, 
	"METHOD_TYPE_NAME" VARCHAR2(20), 
	"NOTIFICATION_FORMAT_ID" NUMBER(12,0) DEFAULT (4) NOT NULL ENABLE, 
	 CONSTRAINT "RHN_MTHTP_RECID_CK" CHECK (recid > 0) ENABLE, 
	 CONSTRAINT "RHN_MTHTP_RECID_PK" PRIMARY KEY ("RECID")
  USING INDEX PCTFREE 10 INITRANS 2 MAXTRANS 255 COMPUTE STATISTICS
  STORAGE(INITIAL 65536 NEXT 1048576 MINEXTENTS 1 MAXEXTENTS 2147483645
  PCTINCREASE 0 FREELISTS 1 FREELIST GROUPS 1 BUFFER_POOL DEFAULT)
  TABLESPACE "USERS"  ENABLE
   ) PCTFREE 10 PCTUSED 40 INITRANS 1 MAXTRANS 255 NOCOMPRESS LOGGING
  STORAGE(INITIAL 65536 NEXT 1048576 MINEXTENTS 1 MAXEXTENTS 2147483645
  PCTINCREASE 0 FREELISTS 1 FREELIST GROUPS 1 BUFFER_POOL DEFAULT)
  TABLESPACE "USERS" ENABLE ROW MOVEMENT 
 
/
