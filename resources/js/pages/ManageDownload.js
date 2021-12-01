import React, { useEffect, useState } from "react";
import {
    Container,
    Row,
    Col,
    Table,
    Button,
    Stack,
    Spinner,
    Alert,
} from "react-bootstrap";
import { csv } from "d3-request";
import DataTable from "react-data-table-component";
import request from "../lib/request";
import { uiText } from "../static/ui-text";
import { useLocale } from "../lib/locale-context";
import takeRight from "lodash/takeRight";
import isEmpty from "lodash/isEmpty";

const ManageDownload = () => {
    const { locale } = useLocale();
    const [log, setLog] = useState([]);
    const [isViewFile, setIsViewFile] = useState(false);
    const [fileLoaded, setFileLoaded] = useState({});
    let text = uiText[locale.active];

    useEffect(async () => {
        const { data, status } = await request().get("/api/download-log");
        if (status === 200) {
            const result = data?.map((d) => {
                let filename = d?.filepath?.split("/");
                filename = takeRight(filename)[0];
                return {
                    ...d,
                    filename: filename,
                };
            });
            setLog(result);
        } else {
            console.log("error");
        }
    }, []);

    const handleViewButton = ({ filepath, filename }) => {
        console.log(filepath, filename);
        setIsViewFile(true);
        csv(filepath, (error, data) => {
            if (error) {
                setFileLoaded({ data: [], columns: [] });
                throw error;
            }
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
    };

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
                        <tbody>
                            {log.map((l, li) => (
                                <tr key={`${l.filename}-${li}`}>
                                    <td>{l?.filename || ""}</td>
                                    <td>{l?.request_by?.email || ""}</td>
                                    <td>
                                        <Button
                                            variant="info"
                                            size="sm"
                                            onClick={() => handleViewButton(l)}
                                        >
                                            View
                                        </Button>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            style={{ marginLeft: "8px" }}
                                            onClick={() =>
                                                console.log(
                                                    "TODO::add action to this button"
                                                )
                                            }
                                        >
                                            Approve
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Col>
            </Row>
            {isViewFile && isEmpty(fileLoaded) && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                    className="mb-3"
                >
                    <Spinner
                        animation="border"
                        role="status"
                        size="sm"
                        variant="info"
                    >
                        <span className="sr-only">Loading...</span>
                    </Spinner>
                </div>
            )}
            {isViewFile && !isEmpty(fileLoaded) && (
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
