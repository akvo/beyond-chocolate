import React, { useEffect, useState } from "react";
import {
    Container,
    Row,
    Col,
    Table,
    Button,
    Spinner,
    Alert,
    Badge,
} from "react-bootstrap";
import { csv } from "d3-request";
import DataTable from "react-data-table-component";
import request from "../lib/request";
import { FullScreenModal } from "../components/Modal";
import { uiText } from "../static/ui-text";
import { useLocale } from "../lib/locale-context";
import takeRight from "lodash/takeRight";
import isEmpty from "lodash/isEmpty";

const datatableCustomStyle = {
    headCells: {
        style: {
            background: "#673016",
            color: "#fff",
            fontWeight: "bold",
        },
    },
};

const Loading = () => (
    <Spinner
        animation="border"
        role="status"
        size="sm"
        variant="info"
        style={{ marginTop: "10vh" }}
    >
        <span className="sr-only">Loading...</span>
    </Spinner>
);

const ManageDownload = () => {
    const { locale } = useLocale();
    const [log, setLog] = useState([]);
    const [reload, setReload] = useState(false);
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
                    isLoading: false,
                };
            });
            setLog(result);
        }
        setReload(false);
    }, [reload]);

    const handleViewButton = ({ id, filepath, filename }) => {
        setIsViewFile(true);
        csv(filepath, (error, data) => {
            if (error) {
                setFileLoaded({
                    id: id,
                    title: filename,
                    data: [],
                    columns: [],
                });
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
            setFileLoaded({
                id: id,
                title: filename,
                data: dataTemp,
                columns: columns,
            });
        });
    };

    const setLoading = (id, status) => {
        const updateLog = log?.map((l) => {
            return {
                ...l,
                isLoading: l?.id === id ? status : l.isLoading,
            };
        });
        setLog(updateLog);
    };

    const handleApproveRejectButton = async (selected, logStatus) => {
        setLoading(selected?.id, true);
        const { data, status } = await request().patch(
            `/api/download-log/update-status/${selected?.id}`,
            {
                status: logStatus,
            }
        );
        if (status === 200) {
            setReload(true);
        }
        setLoading(selected?.id, false);
        setIsViewFile(false);
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
                                <th className="pl-3">Status</th>
                                <th className="pl-3">Request By</th>
                                <th className="pl-3">{text.tbColAction}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {log.map((l, li) => (
                                <tr key={`${l.filename}-${li}`}>
                                    <td>{l?.filename || ""}</td>
                                    <td className="pl-3">
                                        <Badge
                                            variant={
                                                l?.status === "requested"
                                                    ? "secondary"
                                                    : l?.status === "rejected"
                                                    ? "danger"
                                                    : "success"
                                            }
                                        >
                                            {l?.status}
                                        </Badge>
                                    </td>
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
                                                handleApproveRejectButton(
                                                    l,
                                                    "approved"
                                                )
                                            }
                                            disabled={l?.isLoading}
                                        >
                                            <>
                                                {l?.isLoading && (
                                                    <Spinner
                                                        as="span"
                                                        animation="border"
                                                        size="sm"
                                                        role="status"
                                                        aria-hidden="true"
                                                        style={{
                                                            marginRight: "8px",
                                                        }}
                                                    />
                                                )}
                                                Approve
                                            </>
                                        </Button>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            style={{ marginLeft: "8px" }}
                                            onClick={() =>
                                                handleApproveRejectButton(
                                                    l,
                                                    "rejected"
                                                )
                                            }
                                        >
                                            Reject
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Col>
            </Row>
            <FullScreenModal
                text={text}
                title={fileLoaded?.title || ""}
                show={isViewFile}
                handleClose={() => setIsViewFile(false)}
                handleApprove={() =>
                    handleApproveRejectButton(fileLoaded, "approved")
                }
                handleReject={() =>
                    handleApproveRejectButton(fileLoaded, "rejected")
                }
                content={
                    <Row className="justify-content-center">
                        <Col id="fileLoadedTmp" className="mx-auto" md="12">
                            <DataTable
                                columns={fileLoaded?.columns || []}
                                data={fileLoaded?.data || []}
                                fixedHeader
                                fixedHeaderScrollHeight="70vh"
                                progressPending={isEmpty(fileLoaded)}
                                progressComponent={<Loading />}
                                customStyles={datatableCustomStyle}
                            />
                        </Col>
                    </Row>
                }
            />
        </Container>
    );
};

export default ManageDownload;
