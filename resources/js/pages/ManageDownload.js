import React, { useEffect, useState } from "react";
import {
    Container,
    Row,
    Col,
    Table,
    Button,
    Spinner,
    Alert,
} from "react-bootstrap";
import { csv } from "d3-request";
import DataTable from "react-data-table-component";
import { uiText } from "../static/ui-text";
import { useLocale } from "../lib/locale-context";

const ManageDownload = () => {
    const { locale } = useLocale();
    const [isViewFile, setIsViewFile] = useState(false);
    const [fileLoaded, setFileLoaded] = useState({});
    let text = uiText[locale.active];

    useEffect(() => {
        csv("uploads/idh/C-Retail-Joy.csv", (error, data) => {
            if (error) throw error;
            const columns = data?.columns?.map((col) => {
                let width = "5%";
                if (col === "repeat") {
                    width = "7%";
                }
                if (col === "groupName") {
                    width = "15%";
                }
                if (col === "question" || col === "answer") {
                    width = "34%";
                }
                return {
                    id: col,
                    name: col,
                    width: width,
                    wrap: true,
                    selector: (row) => row[col],
                };
            });
            const dataTemp = data?.map((d, di) => {
                return {
                    id: di + 1,
                    ...d,
                };
            });
            setFileLoaded({ data: dataTemp, columns: columns });
        });
    }, []);

    return (
        <Container fluid>
            <Row className="justify-content-center">
                <Col className="mx-auto" md="10">
                    <h3>{text.navManageDownloadRequest}</h3>
                    {/* <p>{text.textInfoSubmission}</p> */}
                    <hr />
                    {/* {renderAlert()} */}
                    <Table bordered hover responsive size="sm">
                        <thead>
                            <tr>
                                <th className="pl-3">Filename</th>
                                <th className="pl-3">Request By</th>
                                <th className="pl-3">{text.tbColAction}</th>
                            </tr>
                        </thead>
                        {/* <tbody>{renderSubmissions()}</tbody> */}
                    </Table>
                </Col>
            </Row>
            {isViewFile && (
                <Row className="justify-content-center">
                    <Col id="fileLoadedTmp" className="mx-auto" md="10">
                        <DataTable
                            columns={fileLoaded?.columns || []}
                            data={fileLoaded?.data || []}
                            pagination
                        />
                    </Col>
                </Row>
            )}
        </Container>
    );
};

export default ManageDownload;
