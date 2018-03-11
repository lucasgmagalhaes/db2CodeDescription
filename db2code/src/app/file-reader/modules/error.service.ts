import { SetStatus } from '../enuns/global';
import { KeyConsts } from './../enuns/global';
import { ErrorModel } from './../modules/error.model.clss';
import { Injectable } from '@angular/core';

/**
 * @export
 * @class FileService
 * @version 1.0
 * @author lgmagalhes
 * @howToUse
 *
 *
 */
@Injectable()
export class FileService {

    private fileText: string;
    private codeElements: ErrorModel[];
    public actualline = 0;
    private totalLines: number;

    /* Code block used to define if a attribute was already defined or not */
    private statusForDestination = SetStatus.NOTSETTED;
    private statusForDescription = SetStatus.NOTSETTED;
    private statusForExplanation = SetStatus.NOTSETTED;
    private statusForSystemAction = SetStatus.NOTSETTED;
    private statusForProgramerResponse = SetStatus.NOTSETTED;
    private statusForCode = SetStatus.NOTSETTED;

    constructor() { }

    /**
     * Restore the value of statusof.. to 'NOTSETTED'
     *
     * The restoration must be done when all information required for an ErrorModule object is complete
     */
    private resetAtributeStatus(): void {
        this.statusForDestination = SetStatus.NOTSETTED;
        this.statusForDescription = SetStatus.NOTSETTED;
        this.statusForExplanation = SetStatus.NOTSETTED;
        this.statusForSystemAction = SetStatus.NOTSETTED;
        this.statusForProgramerResponse = SetStatus.NOTSETTED;
        this.statusForCode = SetStatus.NOTSETTED;
    }

    /**
     * Return the percentage of the file processing
     *
     * @param actualLine actual line
     */
    public getPercentage(actualLine: number): number {
        this.actualline = +((actualLine * 100) / this.totalLines).toFixed(0);
        return this.actualline;
    }

    /**
     * Loads the file read into memory and sets the total of line this file has in a variable
     * @param event file
     */
    public fileUpload(event) {
        const reader = new FileReader();
        reader.readAsText(event.srcElement.files[0]);
        const local = this;
        reader.onload = function () {
            local.fileText = reader.result;
            local.totalLines = local.fileText.split('\n').length;
            local.processFile();
        };
    }

    /**
     *
     * Read each line of the file, creating a object of ErrorModule
     *
    */
    public processFile() {
        const lines = this.fileText.split('\n');

        let errorObj = new ErrorModel();
        this.codeElements = new Array();

        for (let line = 0; line < lines.length; line++) {

            const lineText = lines[line];
            const splited = lineText.split(' ');

            this.getPercentage(line + 1);
            this.codeElements.push(errorObj);

            if (lineText !== '' || lineText !== null) {

                /* check if is code */
                if (this.checkIfIsCode(lineText)) {

                    errorObj.$code = lineText;

                    /* Check if is destination */
                } else if (splited[0] === KeyConsts.DESTINATION || this.statusForDestination.valueOf === SetStatus.READING.valueOf) {

                    errorObj.$destination = splited[1];
                    this.statusForDestination = SetStatus.READING;

                    /* Check if is explanation */
                } else if (splited[0] === KeyConsts.EXPLANATION || this.statusForExplanation.valueOf === SetStatus.READING.valueOf) {

                    errorObj.appendExplanation(splited[1]);
                    this.statusForExplanation = SetStatus.READING;

                    if (line + 1 < lines.length && this.isInformationFinished(lines[line + 1])) {
                        this.statusForDestination = SetStatus.FINISHED;
                    }

                    /* Check if is system_action */
                } else if (splited[0] === KeyConsts.SYSTEM_ACTION || this.statusForSystemAction.valueOf === SetStatus.READING.valueOf) {

                    errorObj.appendSystemAction(splited[1]);
                    this.statusForSystemAction = SetStatus.READING;

                    if (line + 1 < lines.length && this.isInformationFinished(lines[line + 1])) {
                        this.statusForSystemAction = SetStatus.FINISHED;
                    }

                    /* check if is programer_response */
                } else if (splited[0] === KeyConsts.PROGRAMER_RESPONSE ||
                    this.statusForProgramerResponse.valueOf === SetStatus.READING.valueOf
                    || splited[0] === KeyConsts.SYSTEM_PROGRAMER_RESPONSE) {

                    errorObj.appendProgrammerResponse(splited[1]);
                    this.statusForProgramerResponse = SetStatus.READING;

                    if (line + 1 < lines.length && this.isInformationFinished(lines[line + 1])) {
                        this.statusForProgramerResponse = SetStatus.FINISHED;
                    }

                    /* if it's belong to no one, so it's a description */
                } else if (this.isFullLineString(lineText) || this.statusForDescription.valueOf === SetStatus.READING.valueOf) {

                    errorObj.appendDescription(splited[1]);
                    this.statusForDescription = SetStatus.READING;

                    if (line + 1 < lines.length && this.isInformationFinished(lines[line + 1])) {
                        this.statusForDescription = SetStatus.FINISHED;
                    }
                }
            }
            errorObj = new ErrorModel();
        }
    }

    /**
     * When the description of a error is at the beginning of a page, then the error code is at the end of
     * the line.
     *
     * Ex: The page starts with: "DSNB320I  DSNB325A"
     * the next block of description and explanations refers to the code DSNB325A
     * @param line
     */
    private checkIfIsCodeInPage(line: string): boolean {
        const splited = line.split(' ');
        if (splited.length > 1) {
            if (splited[1].length === splited[splited.length - 1].length) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if there is more informations relationated to the atribute.
     *
     * The description of some attribute ends when is made a break line or the first word of the next line is one
     * of the possible types of attributes
     * @param line
     */
    private isInformationFinished(nextline: string): boolean {
        const splited = nextline.split(' ');
        if (nextline === null || nextline === '') {
            return true;
        } else if (splited[0] === KeyConsts.DESTINATION || splited[0] === KeyConsts.EXPLANATION
            || splited[0] === KeyConsts.SYSTEM_ACTION || splited[0] === KeyConsts.PROGRAMER_RESPONSE
            || splited[0] === KeyConsts.SYSTEM_PROGRAMER_RESPONSE) {
            return true;
        }
        return null;
    }

    /**
     * Check if the line if totally made by strings
     *
     * When a line is made totally by strings(there's not only numbers), it means that the line is a description
     * of some attribute
     * @param line
     */
    private isFullLineString(line: string): boolean {
        try {
            const aux = +line;
            return false;
        } catch (e) {
            return true;
        }
    }

    /**
     * Verify if the line represent a error code
     *
     * A line can be a code if it is only number or the line has only one string which has at least length
     * equals to 8.
     * @param line
     */
    private checkIfIsCode(line: string): boolean {
        try {
            const aux = +line;
            return true;
        } catch (e) {
            if (line.length <= 8) {
                return true;
            }
            return false;
        }
    }

    /**
     * Checks if the line represents a page
     *
     * Lines representing a page have the follow structure:
     * "DSNB320I  DSNB325A".
     *
     * They show what is the first code error that will be described, and the last
     * @param words line of the file
     */
    private checkPaginationLine(words: string[]): string {
        let numberObj = Number.MIN_VALUE;

        words.forEach(element => {
            try {
                numberObj = +element;
                if (numberObj !== Number.MIN_VALUE) {
                    return element;
                }
            } catch (e) {
                console.log(e);
            }
        });
        return null;
    }
}