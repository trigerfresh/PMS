import { Button, Card, Col, Form, Row } from 'react-bootstrap'
import {
  FaPlus,
  FaTimes,
  FaSearch,
  FaUndo,
  FaFileExcel,
  FaFileDownload,
} from 'react-icons/fa'

const FilterPanel = ({
  searchFields,
  setSearchFields,
  dateFilter,
  setDateFilter,
  // monthYearFilter,
  // setMonthYearFilter,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  onSearch,
  onReset,
  onDownloadExcel,
  searchOptions,
  filterMode = 'date',
  showDownload = true,
  children,
}) => {
  const handleFieldChange = (index, e) => {
    const updated = [...searchFields]
    updated[index][e.target.name] = e.target.value
    setSearchFields(updated)
  }

  const addField = () => {
    setSearchFields([
      ...searchFields,
      { field: searchOptions[0]?.value || '', keyword: '' },
    ])
  }

  const removeField = (index) => {
    setSearchFields(searchFields.filter((_, i) => i !== index))
  }

  return (
    <Card
      className="filter-card p-2 mb-3 shadow-sm border-0"
      style={{ backgroundColor: '#f8f9fa' }}
    >
      <Form
        onSubmit={(e) => {
          e.preventDefault()
          onSearch(e)
        }}
      >
        {searchFields.map((item, index) => (
          <Row key={index} className="align-items-center g-2 mb-1">
            <Col xs={12} md={2}>
              <Form.Select
                size="sm"
                name="field"
                value={item.field}
                onChange={(e) => handleFieldChange(index, e)}
              >
                {searchOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Form.Select>
            </Col>

            <Col xs={12} md={2}>
              <Form.Control
                size="sm"
                type="text"
                name="keyword"
                placeholder="Enter Keyword"
                value={item.keyword}
                onChange={(e) => handleFieldChange(index, e)}
                autoComplete="on"
              />
            </Col>

            {/* Render custom children (e.g., specific dropdowns) on the first row */}
            {index === 0 && children}

            {/* ONLY render Date/Month-Year filters on the FIRST row */}
            {/* {index === 0 && filterMode === 'date' && (
              <>
                <Col xs={6} md={2}>
                  <Form.Control
                    size="sm"
                    type="date"
                    placeholder="From"
                    value={dateFilter?.from || ''}
                    onChange={(e) =>
                      setDateFilter({ ...dateFilter, from: e.target.value })
                    }
                  />
                </Col>
                <Col xs={6} md={2}>
                  <Form.Control
                    size="sm"
                    type="date"
                    placeholder="To"
                    value={dateFilter?.to || ''}
                    onChange={(e) =>
                      setDateFilter({ ...dateFilter, to: e.target.value })
                    }
                  />
                </Col>
              </>
            )} */}

            {index === 0 && filterMode === 'month-year' && (
              <>
                <Col xs={6} md={2}>
                  <Form.Select
                    size="sm"
                    value={selectedMonth || ''}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  >
                    <option value="">Month</option>
                    <option value="1">January</option>
                    <option value="2">February</option>
                    <option value="3">March</option>
                    <option value="4">April</option>
                    <option value="5">May</option>
                    <option value="6">June</option>
                    <option value="7">July</option>
                    <option value="8">August</option>
                    <option value="9">September</option>
                    <option value="10">October</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
                  </Form.Select>
                </Col>

                <Col xs={6} md={2}>
                  <Form.Select
                    size="sm"
                    value={selectedYear || ''}
                    onChange={(e) => setSelectedYear(e.target.value)}
                  >
                    <option value="">Year</option>
                    {Array.from({ length: 10 }, (_, i) => {
                      const year = new Date().getFullYear() - i
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      )
                    })}
                  </Form.Select>
                </Col>
              </>
            )}

            <Col xs="auto">
              {index === searchFields.length - 1 ? (
                <Button variant="outline-success" size="sm" onClick={addField}>
                  <FaPlus />
                </Button>
              ) : (
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => removeField(index)}
                >
                  <FaTimes />
                </Button>
              )}
            </Col>

            {/* Render action buttons only on the first row */}
            {index === 0 && (
              <Col xs="auto" className="ms-auto d-flex gap-2">
                <Button
                  type="submit"
                  size="sm"
                  className="d-flex align-items-center gap-1 text-white"
                  style={{ backgroundColor: '#00baf2', border: 'none' }}
                  onClick={onSearch}
                >
                  <FaSearch />
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  className="d-flex align-items-center gap-1"
                  onClick={onReset}
                >
                  <FaUndo />
                </Button>
                {showDownload && (
                  <Button
                    variant="success"
                    size="sm"
                    className="d-flex align-items-center gap-1"
                    onClick={onDownloadExcel}
                  >
                    <FaFileDownload />
                  </Button>
                )}
              </Col>
            )}
          </Row>
        ))}
      </Form>
    </Card>
  )
}

export default FilterPanel
