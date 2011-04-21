-- created by Oraschemadoc Thu Apr 21 10:03:38 2011
-- visit http://www.yarpen.cz/oraschemadoc/ for more info

  CREATE TABLE "SPACEWALK"."RHNVIRTUALINSTANCEEVENTLOG" 
   (	"ID" NUMBER NOT NULL ENABLE, 
	"VIRTUAL_INSTANCE_ID" NUMBER, 
	"EVENT_TYPE" NUMBER NOT NULL ENABLE, 
	"EVENT_METADATA" VARCHAR2(4000), 
	"OLD_STATE" NUMBER NOT NULL ENABLE, 
	"NEW_STATE" NUMBER NOT NULL ENABLE, 
	"OLD_MEMORY_SIZE_K" NUMBER, 
	"NEW_MEMORY_SIZE_K" NUMBER, 
	"OLD_VCPUS" NUMBER, 
	"NEW_VCPUS" NUMBER, 
	"OLD_HOST_SYSTEM_ID" NUMBER, 
	"NEW_HOST_SYSTEM_ID" NUMBER, 
	"OLD_HOST_SYSTEM_NAME" VARCHAR2(128), 
	"NEW_HOST_SYSTEM_NAME" VARCHAR2(128), 
	"LOCAL_TIMESTAMP" DATE NOT NULL ENABLE, 
	"CREATED" DATE DEFAULT (sysdate) NOT NULL ENABLE, 
	"MODIFIED" DATE DEFAULT (sysdate) NOT NULL ENABLE, 
	 CONSTRAINT "RHN_VIEL_ID_PK" PRIMARY KEY ("ID")
  USING INDEX PCTFREE 10 INITRANS 2 MAXTRANS 255 COMPUTE STATISTICS
  STORAGE(INITIAL 65536 NEXT 1048576 MINEXTENTS 1 MAXEXTENTS 2147483645
  PCTINCREASE 0 FREELISTS 1 FREELIST GROUPS 1 BUFFER_POOL DEFAULT)
  TABLESPACE "USERS"  ENABLE, 
	 CONSTRAINT "RHN_VIEL_VII_FK" FOREIGN KEY ("VIRTUAL_INSTANCE_ID")
	  REFERENCES "SPACEWALK"."RHNVIRTUALINSTANCE" ("ID") ON DELETE CASCADE ENABLE, 
	 CONSTRAINT "RHN_VIEL_ET_FK" FOREIGN KEY ("EVENT_TYPE")
	  REFERENCES "SPACEWALK"."RHNVIRTUALINSTANCEEVENTTYPE" ("ID") ENABLE, 
	 CONSTRAINT "RHN_VIEL_OLD_STATE_FK" FOREIGN KEY ("OLD_STATE")
	  REFERENCES "SPACEWALK"."RHNVIRTUALINSTANCESTATE" ("ID") ENABLE, 
	 CONSTRAINT "RHN_VIEL_NEW_STATE_FK" FOREIGN KEY ("NEW_STATE")
	  REFERENCES "SPACEWALK"."RHNVIRTUALINSTANCESTATE" ("ID") ENABLE
   ) PCTFREE 10 PCTUSED 40 INITRANS 1 MAXTRANS 255 NOCOMPRESS LOGGING
  STORAGE(INITIAL 65536 NEXT 1048576 MINEXTENTS 1 MAXEXTENTS 2147483645
  PCTINCREASE 0 FREELISTS 1 FREELIST GROUPS 1 BUFFER_POOL DEFAULT)
  TABLESPACE "USERS" ENABLE ROW MOVEMENT 
 
/
