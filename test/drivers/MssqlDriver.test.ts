import { expect } from "chai";
import { MssqlDriver } from '../../src/drivers/MssqlDriver'
import * as Sinon from 'sinon'
import * as MSSQL from 'mssql'
import { EntityInfo } from '../../src/models/EntityInfo'
import { ColumnInfo } from '../../src/models/ColumnInfo'
import { RelationInfo } from '../../src/models/RelationInfo'
import { Table, IColumnMetadata } from "mssql";
import { NamingStrategy } from "../../src/NamingStrategy";

class fakeResponse implements MSSQL.IResult<any>  {
    recordsets: MSSQL.IRecordSet<any>[];
    recordset: MSSQL.IRecordSet<any>;
    rowsAffected: number[];
    output: { [key: string]: any; };
}

class fakeRecordset extends Array<any> implements MSSQL.IRecordSet<any>{
    columns: IColumnMetadata;
    toTable(): Table {
        return new Table();
    }
}

describe('MssqlDriver', function () {
    let driver: MssqlDriver
    let sandbox = Sinon.sandbox.create()

    beforeEach(() => {
        driver = new MssqlDriver();
        driver.namingStrategy = new NamingStrategy();
    })

    afterEach(() => {
        sandbox.restore()
    })

    it('should get tables info', async () => {
        sandbox.stub(MSSQL, 'Request')
            .returns(
            {
                query: (q) => {
                    let response = new fakeResponse();
                    response.recordset = new fakeRecordset();
                    response.recordset.push({ TABLE_SCHEMA: 'schema', TABLE_NAME: 'name' })
                    return response;
                }
            })
        let result = await driver.GetAllTables('schema')
        let expectedResult = <EntityInfo[]>[];
        let y = new EntityInfo();
        y.EntityName = 'name'
        y.Schema='schema'
        y.Columns = <ColumnInfo[]>[];
        y.Indexes = <IndexInfo[]>[];
        expectedResult.push(y)
        expect(result).to.be.deep.equal(expectedResult)
    })
    it('should get columns info', async () => {
        sandbox.stub(MSSQL, 'Request')
            .returns(
            {
                query: (q) => {
                    let response = new fakeResponse();
                    response.recordset = new fakeRecordset();
                    response.recordset.push({
                        TABLE_NAME: 'name', CHARACTER_MAXIMUM_LENGTH: 0,
                        COLUMN_DEFAULT: 'a', COLUMN_NAME: 'name', DATA_TYPE: 'int',
                        IS_NULLABLE: 'YES', NUMERIC_PRECISION: 0, NUMERIC_SCALE: 0,
                        IsIdentity: 1
                    })
                    return response;
                }
            })

        let entities = <EntityInfo[]>[];
        let y = new EntityInfo();
        y.EntityName = 'name'
        y.Columns = <ColumnInfo[]>[];
        y.Indexes = <IndexInfo[]>[];
        entities.push(y)
        var expected: EntityInfo[] = JSON.parse(JSON.stringify(entities));
        expected[0].Columns.push({
            lenght: null,
            default: 'a',
            is_nullable: true,
            isPrimary: false,
            is_generated: true,
            tsName: 'name',
            sqlName: 'name',
            numericPrecision: null,
            numericScale: null,
            width: null,
            sql_type: 'int',
            ts_type: 'number',
            enumOptions: null,
            is_unique:false,
            is_array:false,
            relations: <RelationInfo[]>[],
        })
        let result = await driver.GetCoulmnsFromEntity(entities, 'schema');
        expect(result).to.be.deep.equal(expected)
    })
    it('should find primary indexes')
    it('should get indexes info')
    it('should get relations info')
})
