import InsightFacade from "../../src/controller/InsightFacade";
import {
	InsightDatasetKind, InsightError, InsightResult, NotFoundError, ResultTooLargeError
} from "../../src/controller/IInsightFacade";
import chai, {expect} from "chai";
import {clearDisk, getContentFromArchives} from "../resources/archives/TestUtil";
import {folderTest} from "@ubccpsc310/folder-test";
import chaiAsPromised from "chai-as-promised";
import {emptydir} from "fs-extra";

chai.use(chaiAsPromised);
type Input = unknown;
type Output = Promise<InsightResult[]>;
type Error = "InsightError" | "ResultTooLargeError";

describe("InsightFacade", function () {

	describe("addDataset", function () {
		let sections: string;
		let facade: InsightFacade;
		let empty: string;
		let rooms: string;

		before(function () {
			sections = getContentFromArchives("pair.zip");
			empty = getContentFromArchives("empty.zip");
			rooms = getContentFromArchives("campus.zip");
		});

		beforeEach(function () {
			clearDisk();
			facade = new InsightFacade();
		});

		it("should add a dataset successfully", function () {
			const result = facade.addDataset("CS", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.have.members(["CS"]);
		});

		it("should add room dataset successfully", function () {
			const result = facade.addDataset("room", rooms, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.have.members(["room"]);
		});

		it("should add a dataset successfully with hyphen in its id", function () {
			const result = facade.addDataset("UBC-CS", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.have.members(["UBC-CS"]);
		});


		it("should reject with an empty dataset id", function () {
			const result = facade.addDataset("", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject with a wrong file name contained in zip", function () {
			const csZip = getContentFromArchives("cs.zip");
			const result = facade.addDataset("UBC", csZip, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});


		it("should reject a dataset with underscore in its id", function () {
			const result = facade.addDataset("UBC_CS", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject with a whitespace only dataset id(one whitespace)", function () {
			const result = facade.addDataset(" ", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject with an empty zip", function () {
			// const empty = getContentFromArchives("empty.zip");
			const result = facade.addDataset("ubc", empty, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject with a whitespace only dataset id(multiple whitespace)", function () {
			const result = facade.addDataset("    ", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});


		it("should reject when the content is not a zip file", function () {
			const NoZipFile = getContentFromArchives("test.json");
			const result = facade.addDataset("UBC", NoZipFile, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

        // empty zip file
		it("should reject with content argument has no valid section", function () {
			const noValidSectionsContent = getContentFromArchives("testZip.zip");
			const result = facade.addDataset("UBC", noValidSectionsContent, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

        // empty json file
		it("should reject with content argument has an empty json file", function () {
			const emptyJson = getContentFromArchives("courses_empty_json.zip");
			const result = facade.addDataset("UBC", emptyJson, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject with content argument has an empty json file", function () {
			const cs2 = getContentFromArchives("cs2.zip");
			const result = facade.addDataset("UBC", cs2, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject with content argument has an empty json file", function () {
			const emptyJson = getContentFromArchives("courses_empty_json.zip");
			const result = facade.addDataset("UBC", emptyJson, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

        // a text file in the zip
		it("should reject with content argument has an text file in it", function () {
			const txtZip = getContentFromArchives("courses_txt.zip");
			const result = facade.addDataset("UBC", txtZip, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject with an invalid kind", function () {
			const result = facade.addDataset("UBC", sections, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});
		it("should reject with adding a same dataset twice", async function () {
			await facade.addDataset("UBC", sections, InsightDatasetKind.Sections);
			const result = facade.addDataset("UBC", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("successfully adding two different dataset", async function () {
			this.timeout(5000);
			const courseSmaller = getContentFromArchives("courses_smaller.zip");
			await facade.addDataset("smaller", courseSmaller, InsightDatasetKind.Sections);
			const result = facade.addDataset("UBC", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.have.members(["UBC","smaller"]);
		});

	});

	describe("removeDataset", function () {
		let sections: string;
		let courseSmaller: string;
		let facade: InsightFacade;

		before(function () {
			sections = getContentFromArchives("pair.zip");
			courseSmaller = getContentFromArchives("courses_smaller.zip");
		});

		beforeEach(function () {
			clearDisk();
			facade = new InsightFacade();
		});

		it("successfully remove a previously added dataset", async function () {
			await facade.addDataset("UBC", sections, InsightDatasetKind.Sections);
			const result = await facade.removeDataset("UBC");
			expect(result).to.equal("UBC");
		});
        // todo: move from two added datasets to one

        /*            return result.then((result) => {
                expect(result).to.equal("UBC");
            });*/
		it("should reject when removes a non existing dataset", function () {
			const result = facade.removeDataset("Hellooo");
			return expect(result).to.eventually.be.rejectedWith(NotFoundError);
		});

		it("should reject when removes a non existing dataset 2", async function () {
			await facade.addDataset("UBC", sections, InsightDatasetKind.Sections);
			const result = facade.removeDataset("Hellf");
			return expect(result).to.eventually.be.rejectedWith(NotFoundError);
		});

		it("reject when trying to move the same dataset twice", async function () {
			await facade.addDataset("UBC", sections, InsightDatasetKind.Sections);
			await facade.removeDataset("UBC");
			const result = facade.removeDataset("UBC");
			return expect(result).to.eventually.be.rejectedWith(NotFoundError);
		});

		it("should reject an invalid id", function () {
			const result = facade.removeDataset("UBC_");
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject an empty id string", function () {
			const result = facade.removeDataset("");
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject a whitespace id", function () {
			const result = facade.removeDataset(" ");
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should successfully remove a dataset(multiple datasets added)", async function () {
			this.timeout(4000);
			await facade.addDataset("UBC", sections, InsightDatasetKind.Sections);
			await facade.addDataset("UBC2", sections, InsightDatasetKind.Sections);
			const result = facade.removeDataset("UBC2");
			return expect(result).to.eventually.equal("UBC2");
		});

		it("should successfully remove a dataset(multiple datasets added) 2", async function () {
			this.timeout(4000);
			await facade.addDataset("UBC", sections, InsightDatasetKind.Sections);
			await facade.addDataset("UBC2", sections, InsightDatasetKind.Sections);
			await facade.removeDataset("UBC2");
			facade.removeDataset("UBC2");
			const result = facade.removeDataset("UBC");
			return expect(result).to.eventually.equal("UBC");
		});
	});

    // todo: go over this
	describe("listDatasets", function () {
		let sections1: string;
		let sections2: string;
		let facade: InsightFacade;
		let chem121Sessions: string;

		before(function () {
			sections1 = getContentFromArchives("pair.zip");
			sections2 = getContentFromArchives("courses_smaller.zip");
			chem121Sessions = getContentFromArchives("courses_chem121.zip");
            // console.log(chem121Sessions);
		});

		beforeEach(function () {
			clearDisk();
			facade = new InsightFacade();
		});


		it("should list all added datasets", async function () {
			this.timeout(5000);
			await facade.addDataset("UBC", sections1, InsightDatasetKind.Sections);
			const result = await facade.listDatasets();
			console.log(result.at(0));

			expect(result).to.deep.equal([{
				id: "UBC",
				kind: InsightDatasetKind.Sections,
				numRows: 64612
			}]);
		});

		it("list without adding any dataset", async function () {
			const result = await facade.listDatasets();
			expect(result).to.deep.equal([]);
		});

		it("should list all added datasets(two datasets)", async function () {
			this.timeout(5000);
			await facade.addDataset("UBC", sections1, InsightDatasetKind.Sections);
			await facade.addDataset("UBC2", sections1, InsightDatasetKind.Sections);
			const result = await facade.listDatasets();

			expect(result).to.deep.equal([
				{
					id: "UBC",
					kind: InsightDatasetKind.Sections,
					numRows: 64612
				},
				{
					id: "UBC2",
					kind: InsightDatasetKind.Sections,
					numRows: 64612
				}
			]);
		});


		it("should list all added datasets(two datasets)", async function () {
			this.timeout(5000);
			await facade.addDataset("UBC2", sections1, InsightDatasetKind.Sections);
			await facade.addDataset("UBC", sections1, InsightDatasetKind.Sections);
			const result = await facade.listDatasets();

			expect(result).to.deep.equal([
				{
					id: "UBC2",
					kind: InsightDatasetKind.Sections,
					numRows: 64612
				},
				{
					id: "UBC",
					kind: InsightDatasetKind.Sections,
					numRows: 64612
				}
			]);
		});

		it("should list all added datasets(two datasets)", async function () {
			this.timeout(5000);
			await facade.addDataset("UBC", sections1, InsightDatasetKind.Sections);
			await facade.addDataset("chem", sections1, InsightDatasetKind.Sections);
			const result = await facade.listDatasets();
			console.log(result);

			expect(result).to.deep.equal([
				{
					id: "UBC",
					kind: InsightDatasetKind.Sections,
					numRows: 64612
				},
				{
					id: "chem",
					kind: InsightDatasetKind.Sections,
					numRows: 64612
				}
			]);
		});

		it("should list all added datasets(two datasets)", async function () {
			this.timeout(5000);
			await facade.addDataset("chem", sections1, InsightDatasetKind.Sections);
			await facade.addDataset("UBC", sections1, InsightDatasetKind.Sections);
			const result = await facade.listDatasets();

			expect(result).to.deep.equal([
				{
					id: "chem",
					kind: InsightDatasetKind.Sections,
					numRows: 64612
				},
				{
					id: "UBC",
					kind: InsightDatasetKind.Sections,
					numRows: 64612
				}
			]);
		});


		it("should list all added datasets(two different content datasets)", async function () {
			this.timeout(5000);
			await facade.addDataset("UBC", sections1, InsightDatasetKind.Sections);
			await facade.addDataset("UBC2", sections1, InsightDatasetKind.Sections);
			const result = await facade.listDatasets();

			expect(result).to.deep.equal([
				{
					id: "UBC",
					kind: InsightDatasetKind.Sections,
					numRows: 64612
				},
				{
					id: "UBC2",
					kind: InsightDatasetKind.Sections,
					numRows: 64612
				}
			]);
		});

		it("should return an empty array when no datasets have been added", function () {
			this.timeout(5000);
			const result = facade.listDatasets();
			return expect(result).to.eventually.be.an("array").that.is.empty;
		});

		it("should return an empty array when no datasets have been added(second test)", function () {
			this.timeout(5000);
			return facade.listDatasets()
				.then((result) => {
					expect(result).to.be.an("array");
					expect(result).to.be.empty;
				});
		});
	});

	describe("performQuery", function () {
		let sections: string;
		let facade: InsightFacade;

		before(function () {
			sections = getContentFromArchives("pair.zip");
		});

		beforeEach(function () {
			clearDisk();
			facade = new InsightFacade();
		});

		it("should reject with a query being a string '111'", function () {
			const query = "111";
			return expect(facade.performQuery(query)).to.be.rejectedWith(InsightError);
		});

		it("should reject with a query being an empty string", function () {
			const query = "";
			return expect(facade.performQuery(query)).to.be.rejectedWith(InsightError);
		});

		it("should reject with a query being number", function () {
			const query = 123;
			return expect(facade.performQuery(query)).to.be.rejectedWith(InsightError);
		});

		it("should reject with a query being boolean", function () {
			const query = false;
			return expect(facade.performQuery(query)).to.be.rejectedWith(InsightError);
		});

	});


	describe("Dynamic folder test for performQuery", function () {
		let facade: InsightFacade;
		let sections: string;
		let rooms: string;

		before(function () {
			clearDisk();
			facade = new InsightFacade();
			sections = getContentFromArchives("pair.zip");
			rooms = getContentFromArchives("campus.zip");
			facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
			return facade.addDataset("sections", sections, InsightDatasetKind.Sections);
		});

		function errorValidator(error: any): error is Error {
			return error === "InsightError" || error === "ResultTooLargeError";
		}

		function assertOnError(actual: any, expected: Error): void {
			if (expected === "InsightError") {
				expect(actual).to.be.instanceof(InsightError);
			} else if (expected === "ResultTooLargeError") {
				expect(actual).to.be.instanceof(ResultTooLargeError);
			} else {
				expect.fail("UNEXPECTED ERROR");
			}
		}

		async function assertOnResult(actual: Input, expected: Output): Promise<void> {
			expect((actual as InsightResult[])).to.have.deep.members(await expected);
		}


		folderTest<Input, Output, Error>(
			"performQuery tests",
			(input: Input) => facade.performQuery(input),
			"./test/resources/queries",
			{errorValidator, assertOnError, assertOnResult}
		);
	});
});
